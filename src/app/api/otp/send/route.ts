import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { sendEmailOTP, sendSMSOTP } from "@/lib/otpService";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json(); // email or phone
    if (!key) return NextResponse.json({ error: "Key required (email or phone)" }, { status: 400 });

    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();

    const { db } = await connectToDB();

    // store OTP with expiry 5 mins
    await db.collection("otps").updateOne(
      { key },
      { $set: { otp, createdAt: new Date(), expiresAt: new Date(Date.now() + 5 * 60 * 1000) } },
      { upsert: true }
    );

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
