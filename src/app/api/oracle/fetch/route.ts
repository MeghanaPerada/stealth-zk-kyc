import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import crypto from "crypto";
import { buildTrustProfile } from "@/lib/trustScore";
import { isValidPAN, isValidAadhaar } from "@/lib/manualValidation";

// Simulate secret key for oracle signing
const ORACLE_SECRET = process.env.ORACLE_SECRET || "demo_oracle_secret";

export async function POST(req: NextRequest) {
  try {
    const { key, wallet, data } = await req.json();

    if (!key || !wallet || !data) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { db } = await connectToDB();

    // 1️⃣ Determine source and validate manual data
    const source: "digilocker" | "manual" = data.type === "digilocker" ? "digilocker" : "manual";

    let validationsPassed = 0;
    if (source === "manual") {
      if (data.pan && isValidPAN(data.pan)) validationsPassed++;
      if (data.aadhaar && isValidAadhaar(data.aadhaar)) validationsPassed++;
    }

    // 2️⃣ Compute Trust Profile
    const trust = buildTrustProfile(source, validationsPassed);

    // 3️⃣ Create identity hash (Simulated Poseidon for Hackathon)
    const panHash = crypto.createHash("sha256").update(data.pan || "DEMO_PAN").digest("hex").substring(0, 16);
    const identityHash = crypto.createHash("sha256")
      .update(`${data.dob || "1998-05-15"}-${(data.aadhaar || "123412341234").slice(-4)}-${panHash}-${wallet}`)
      .digest("hex");

    // 4️⃣ Sign hash (Simulated Oracle Signature — HMAC of identityHash)
    const oracleSignature = crypto
      .createHmac("sha256", ORACLE_SECRET)
      .update(identityHash)
      .digest("hex");

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
