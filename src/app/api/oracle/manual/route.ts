import { NextResponse } from "next/server";
import crypto from "crypto";
import { validateManualKYC } from "@/lib/manualValidation";
import { verifyOtp } from "@/lib/otp";
import { verifyWalletSignature } from "@/lib/verifyWallet";

const { buildPoseidon } = require("circomlibjs");
const ORACLE_SECRET = process.env.ORACLE_SECRET || 'stealth_zk_kyc_secret_12345';

export async function POST(req: Request) {
  try {
    const { userId, otp, wallet, manualData, signature, authMessage } = await req.json();

    // 1. Verify user consent via OTP
    if (!(await verifyOtp(userId, otp))) {
      return NextResponse.json({ error: "Consent not verified" }, { status: 401 });
    }

    // 🛡️ 1b. Verify Wallet Signature (Proof of Ownership)
    if (wallet && signature && authMessage) {
      const isValid = await verifyWalletSignature(wallet, authMessage, signature);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid wallet signature" }, { status: 401 });
      }
      console.log(`[ORACLE-MANUAL] Wallet ${wallet} verified successfully`);
    }

    // 2. Validate input
    const errors = validateManualKYC(manualData);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // 3. Oracle signs data hash
    const dataWithLast4 = {
      ...manualData,
      aadhaar_last4: manualData.aadhaar.slice(-4) // For ZK circuit compatibility
    };

    const dataString = JSON.stringify(dataWithLast4);
    const dataHash = crypto.createHash("sha256").update(dataString).digest("hex");
    const oracleSignature = crypto.createHmac("sha256", ORACLE_SECRET)
      .update(dataHash)
      .digest("hex");

    return NextResponse.json({
      data: dataWithLast4,
      dataHash,
      signature: oracleSignature,
      issuer: "ManualInputOracle",
      _internalData: dataWithLast4 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
