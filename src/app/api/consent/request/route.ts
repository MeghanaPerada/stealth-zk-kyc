import { NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, emailOrMobile } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Generate OTP
    const otp = generateOtp(userId);

    // 2. Simulated SMS/Email
    console.log(`[Consent] Simulating OTP send: ${otp} to ${emailOrMobile || "user"}`);

    return NextResponse.json({
      message: "OTP sent for consent",
      userId,
      demoOtp: otp // Included for demo ease so user doesn't have to check console
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
