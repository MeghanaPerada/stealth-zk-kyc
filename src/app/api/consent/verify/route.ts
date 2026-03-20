import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, otp } = body;

    if (!userId || !otp) {
      return NextResponse.json({ error: "Missing userId or otp" }, { status: 400 });
    }

    if (!(await verifyOtp(userId, otp))) {
      return NextResponse.json({ verified: false, error: "OTP invalid or expired" }, { status: 401 });
    }

    // Consent approved
    return NextResponse.json({ verified: true, message: "Consent granted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
