import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { key, otp } = await req.json();
    if (!key || !otp) return NextResponse.json({ error: "Missing key or otp" }, { status: 400 });

    const { db } = await connectToDB();

    const record = await db.collection("otps").findOne({ key });
    if (!record) return NextResponse.json({ verified: false, error: "No OTP found for this key" }, { status: 401 });

    const now = new Date();
    if (record.otp === otp && new Date(record.expiresAt) > now) {
      await db.collection("otps").deleteOne({ key }); // OTP one-time use
      return NextResponse.json({ verified: true, message: "OTP verified effectively" });
    }
    
    return NextResponse.json({ verified: false, error: "OTP invalid or expired" }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
