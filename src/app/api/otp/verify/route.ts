import { NextRequest, NextResponse } from "next/server";
import { verifyOtpSignature } from "@/lib/otpHmac";

export async function POST(req: NextRequest) {
  try {
    const { key, otp, otpToken } = await req.json();

    if (!key || !otp) {
      return NextResponse.json({ error: "Missing key or otp" }, { status: 400 });
    }

    // New stateless path: verify HMAC signature from the frontend session token
    if (otpToken?.signature && otpToken?.expiresAt) {
      const isValid = verifyOtpSignature(key, otp, otpToken.expiresAt, otpToken.signature);

      if (isValid) {
        console.log(`[OTP] Verified successfully for ${key} via HMAC`);
        return NextResponse.json({ verified: true, message: "OTP verified successfully" });
      } else {
        return NextResponse.json({ verified: false, error: "OTP is invalid or has expired" }, { status: 401 });
      }
    }

    // Fallback: no token provided
    return NextResponse.json(
      { verified: false, error: "OTP session token missing. Please request a new OTP." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[OTP Verify Error]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
