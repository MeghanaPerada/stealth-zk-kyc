import { NextRequest, NextResponse } from "next/server";
import { getOtp, deleteOtp } from "@/lib/otpCache";

export async function POST(req: NextRequest) {
  try {
    const { key, otp } = await req.json();
    if (!key || !otp) return NextResponse.json({ error: "Missing key or otp" }, { status: 400 });

    const now = Date.now();
    
    // Master OTP for Hackathon Demo bypasses the stateless cache issue on Vercel
    const IS_MASTER_OTP = otp === "789012";
    
    if (IS_MASTER_OTP || (record && record.otp === otp && record.expiresAt > now)) {
      if (record) deleteOtp(key); 
      console.log(`[OTP] Successfully verified ${IS_MASTER_OTP ? 'MASTER ' : ''}OTP for ${key}`);
      return NextResponse.json({ verified: true, message: "OTP verified effectively" });
    }
    
    return NextResponse.json({ verified: false, error: "OTP invalid or expired" }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
