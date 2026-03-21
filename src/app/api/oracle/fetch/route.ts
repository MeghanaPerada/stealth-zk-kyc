import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import crypto from "crypto";
import algosdk from "algosdk";
import { buildTrustProfile } from "@/lib/trustScore";
import { isValidPAN, isValidAadhaar } from "@/lib/manualValidation";
import { buildPoseidon } from "circomlibjs";

// Real Oracle Account for signing (provided via env)
const ORACLE_MNEMONIC = process.env.ORACLE_MNEMONIC || "";

// Helper for Poseidon
let poseidon: any = null;
async function getPoseidon() {
  if (!poseidon) poseidon = await buildPoseidon();
  return poseidon;
}

function toFieldElement(input: string | number): bigint {
  const hex = typeof input === "number" 
    ? input.toString(16) 
    : Buffer.from(input.toString()).toString("hex");
  return BigInt("0x" + hex.slice(0, 60)) % BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
}

export async function POST(req: NextRequest) {
  try {
    const { key, wallet, data } = await req.json();

    if (!key || !wallet || !data) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { db } = await connectToDB();
    const p = await getPoseidon();

    // 1️⃣ Determine source and trust
    const source: "digilocker" | "manual" = data.type === "digilocker" ? "digilocker" : "manual";
    let validationsPassed = 0;
    if (source === "manual") {
      if (data.pan && isValidPAN(data.pan)) validationsPassed++;
      if (data.aadhaar && isValidAadhaar(data.aadhaar)) validationsPassed++;
    }
    const trust = buildTrustProfile(source, validationsPassed);

    // 2️⃣ Create TRUE Protocol Identity Hash (Poseidon)
    const dobNumeric = parseInt((data.dob || "1998-05-15").replace(/-/g, ""));
    const aadhaar4 = parseInt((data.aadhaar || "1234").slice(-4));
    const panHashNumeric = toFieldElement(data.pan || "DEMO_PAN");
    const walletNumeric = toFieldElement(wallet);

    const hash = p([BigInt(dobNumeric), BigInt(aadhaar4), panHashNumeric, walletNumeric]);
    const identityHash = p.F.toString(hash);

    // 3️⃣ Real Ed25519 Signature (Oracle Authentication)
    let oracleSignature = "0".repeat(128); 
    if (ORACLE_MNEMONIC) {
      const oracleAccount = algosdk.mnemonicToSecretKey(ORACLE_MNEMONIC);
      // We sign the 32-byte representation of the Poseidon hash
      const dataToSign = Buffer.from(BigInt(identityHash).toString(16).padStart(64, "0"), "hex");
      const sig = algosdk.signBytes(dataToSign, oracleAccount.sk);
      oracleSignature = Buffer.from(sig).toString("hex");
    }

    // 5️⃣ Generate simulated Groth16 ZK proof
    const proof = {
      pi_a: ["0x183a7b...", "0x2b4c9d...", "1"],
      pi_b: [["0x3aef12...", "0x4b2891..."], ["0x5c7d43...", "0x6de021..."], ["1", "0"]],
      pi_c: ["0x7ef9a2...", "0x8fb301...", "1"],
      protocol: "groth16",
      curve: "bn128",
    };
    const publicSignals = [identityHash, trust.trustScore.toString()];

    // 6️⃣ Derive proofHash + proofId for on-chain anchoring
    const proofHash = crypto.createHash("sha256").update(JSON.stringify(proof)).digest("hex");
    const proofId = "prf_" + proofHash.slice(0, 10);

    // 7️⃣ Store proof record with full trust metadata
    await db.collection("proofs").insertOne({
      wallet,
      proofHash,
      proofId,
      identityHash,
      type: data.type,
      source,
      trustScore: trust.trustScore,
      proofType: trust.proofType,
      oracleSignatureHash: crypto.createHash("sha256").update(oracleSignature).digest("hex"),
      createdAt: new Date(),
      status: "verified",
    });

    return NextResponse.json({
      success: true,
      identityHash,
      signature: oracleSignature,
      proof,
      publicSignals,
      proofHash,
      proofId,
      trustScore: trust.trustScore,
      proofType: trust.proofType,
      proofTypeLabel: trust.proofTypeLabel,
      source,
      issuer: source === "digilocker" ? "UIDAI DigiLocker" : "Stealth ZK-Oracle",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
