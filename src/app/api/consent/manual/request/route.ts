import { NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp";
import { sendEmailOTP, sendSMSOTP } from "@/lib/otpService";

export async function POST(req: Request) {
  try {
    const { userId, email, mobile } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const otp = generateOtp(userId);
    
    // Attempt real delivery
    if (email) await sendEmailOTP(email, otp);
    if (mobile) await sendSMSOTP(mobile, otp);

    return NextResponse.json({ 
      message: "OTP dispatched to both email and mobile", 
      userId,
      // demoOtp: otp // REMOVED for production-like demo as requested
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
