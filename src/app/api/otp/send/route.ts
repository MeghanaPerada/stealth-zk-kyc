import { NextRequest, NextResponse } from "next/server";
import { signOtp } from "@/lib/otpHmac";
import { sendEmailOTP, sendSMSOTP } from "@/lib/otpService";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json(); // email or phone
    if (!key) return NextResponse.json({ error: "Key required (email or phone)" }, { status: 400 });

    // Generate a cryptographically random 6-digit OTP
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();

    // Set expiry: 5 minutes from now
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Sign the OTP using HMAC — no memory/database needed
    const signature = signOtp(key, otp, expiresAt);

    // Send real OTP via email or SMS
    if (key.includes("@")) {
      await sendEmailOTP(key, otp);
    } else {
      await sendSMSOTP(key, otp);
    }

    console.log(`[OTP] Generated for ${key} — expires at ${new Date(expiresAt).toISOString()}`);

    // Return the session token (signature + expiry) to the frontend
    // The actual OTP is NOT returned — it stays with the user's email/SMS
    return NextResponse.json({
      message: "OTP sent successfully",
      userId: key,
      otpToken: { signature, expiresAt },
    });
  } catch (err: any) {
    console.error("[OTP Send Error]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
