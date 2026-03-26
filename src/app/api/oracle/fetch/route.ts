import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
const nacl = require('tweetnacl');
import { buildTrustProfile } from "@/lib/trustScore";
import { isValidPAN, isValidAadhaar } from "@/lib/manualValidation";
import { buildPoseidon } from "circomlibjs";

// Oracle Signing Key (provided via env as a 64-character hex string)
const ORACLE_SIGNING_KEY = process.env.ORACLE_SIGNING_KEY || "";

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

/**
 * POST /api/oracle/fetch
 * Fetches identity data, builds trust score, and signs the identity hash using Ed25519.
 */
export async function POST(req: NextRequest) {
  try {
    const { wallet, data } = await req.json();

    if (!wallet || !data) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

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

    // 3️⃣ Real Ed25519 Signature (Oracle Authentication) — bare signature (no domain prefix)
    // op.ed25519verifyBare on-chain expects a raw Ed25519 sig; algosdk.signBytes adds "MX" prefix so we
    // use nacl.sign.detached directly.
    // oracleData = sha256(identityHash_hex_bytes) so it is always exactly 32 bytes
    const identityHashHex = BigInt(identityHash).toString(16).padStart(64, "0");
    const identityHashBytes = new Uint8Array(Buffer.from(identityHashHex, "hex"));
    // Use SHA-256 to produce a stable 32-byte message
    const oracleDataBytes = new Uint8Array(crypto.createHash("sha256").update(identityHashBytes).digest());
    const oracleDataHex = Buffer.from(oracleDataBytes).toString("hex");

    let oracleSignature = "0".repeat(128);
    if (ORACLE_SIGNING_KEY) {
      // ORACLE_SIGNING_KEY: full 64-byte (128 hex char) Ed25519 secret key
      const secretKey = new Uint8Array(Buffer.from(ORACLE_SIGNING_KEY, "hex"));
      // nacl uses the first 32 bytes as the seed; algosdk compatible key layout
      const sig = nacl.sign.detached(oracleDataBytes, secretKey);
      oracleSignature = Buffer.from(sig).toString("hex");
    }

    // 4️⃣ Optional: Log the request (without PII)
    console.log(`[Oracle] Fetching data for wallet: ${wallet.slice(0, 8)}... (No PII stored)`);

    // 5️⃣ Generate simulated Groth16 ZK proof artifacts (For UI demo)
    const proof = {
      pi_a: ["0x183a7b...", "0x2b4c9d...", "1"],
      pi_b: [["0x3aef12...", "0x4b2891..."], ["0x5c7d43...", "0x6de021..."], ["1", "0"]],
      pi_c: ["0x7ef9a2...", "0x8fb301...", "1"],
      protocol: "groth16",
      curve: "bn128",
    };
    const publicSignals = [identityHash, trust.trustScore.toString()];
    const proofHash = crypto.createHash("sha256").update(JSON.stringify(proof)).digest("hex");
    const proofId = "prf_" + proofHash.slice(0, 10);

    return NextResponse.json({
      success: true,
      identityHash,
      // oracleDataHex: the exact 32-byte blob the oracle signed (sha256 of identityHashBytes)
      // Frontend must use this verbatim as oracleData when calling verifyAndRegister
      oracleDataHex,
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
      _internalData: {
        dob: data.dob || "1998-05-15",
        aadhaar_last4: (data.aadhaar || "1234").slice(-4),
        pan: data.pan || "ABCDE1234F"
      }
    });
  } catch (err: any) {
    console.error("[Oracle] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
