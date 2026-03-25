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

    // IMPORTANT: Log for Vercel Dashboard visibility during hackathon
    console.log(`\n************************************************`);
    console.log(`[HACKATHON] OTP for ${key}: ${otp}`);
    console.log(`MASTER OTP FALLBACK: 789012`);
    console.log(`************************************************\n`);

    return NextResponse.json({ 
      message: "OTP sent successfully", 
      userId: key,
      hint: "If email is delayed, check Vercel Logs or use Master OTP" 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
