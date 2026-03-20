import { NextRequest, NextResponse } from "next/server";
import { getOtp, deleteOtp } from "@/lib/otpCache";

export async function POST(req: NextRequest) {
  try {
    const { key, otp } = await req.json();
    if (!key || !otp) return NextResponse.json({ error: "Missing key or otp" }, { status: 400 });

    const record = getOtp(key);
    if (!record) return NextResponse.json({ verified: false, error: "No OTP found for this key" }, { status: 401 });

    const now = Date.now();
    if (record.otp === otp && record.expiresAt > now) {
      deleteOtp(key); // OTP one-time use
      return NextResponse.json({ verified: true, message: "OTP verified effectively" });
    }
    
    return NextResponse.json({ verified: false, error: "OTP invalid or expired" }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
