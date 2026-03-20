import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { userId, otp } = await req.json();
    if (!userId || !otp) return NextResponse.json({ error: "Missing userId or otp" }, { status: 400 });

    if (!(await verifyOtp(userId, otp))) {
      return NextResponse.json({ verified: false, error: "OTP invalid or expired" }, { status: 401 });
    }

    return NextResponse.json({ verified: true, message: "Manual consent granted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
