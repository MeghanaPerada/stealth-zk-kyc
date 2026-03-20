import { NextResponse } from "next/server";
import crypto from "crypto";
import { validateManualKYC } from "@/lib/manualValidation";
import { verifyOtp } from "@/lib/otp";

const { buildPoseidon } = require("circomlibjs");
const ORACLE_SECRET = process.env.ORACLE_SECRET || 'stealth_zk_kyc_secret_12345';

export async function POST(req: Request) {
  try {
    const { userId, otp, wallet, manualData } = await req.json();

    // 1. Verify consent
    if (!verifyOtp(userId, otp)) {
      return NextResponse.json({ error: "Consent not verified" }, { status: 401 });
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
    const signature = crypto.createHmac("sha256", ORACLE_SECRET)
      .update(dataHash)
      .digest("hex");

    return NextResponse.json({
      data: dataWithLast4,
      dataHash,
      signature,
      issuer: "ManualInputOracle",
      _internalData: dataWithLast4 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
