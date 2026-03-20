import { NextRequest, NextResponse } from "next/server";
import { setOtp } from "@/lib/otpCache";
import { sendEmailOTP, sendSMSOTP } from "@/lib/otpService";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json(); // email or phone
    if (!key) return NextResponse.json({ error: "Key required (email or phone)" }, { status: 400 });

    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();

    // store OTP with expiry 5 mins
    setOtp(key, otp);


    // Dispatch real email/SMS if credentials exist
    if (key.includes("@")) {
      await sendEmailOTP(key, otp);
    } else {
      await sendSMSOTP(key, otp);
    }

    // Still log for hackathon demo convenience
    console.log(`[HACKATHON] OTP for ${key}: ${otp}`);

    return NextResponse.json({ message: "OTP sent successfully", userId: key });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
