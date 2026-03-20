import { NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp";
import { sendEmailOTP, sendSMSOTP } from "@/lib/otpService";

import { verifyWalletSignature } from "@/lib/verifyWallet";

export async function POST(req: Request) {
  try {
    const { userId, email, mobile, wallet, signature, authMessage } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 🛡️ Step 0: Verify Wallet Signature (Proof of Ownership)
    if (wallet && signature && authMessage) {
      const isValid = await verifyWalletSignature(wallet, authMessage, signature);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid wallet signature" }, { status: 401 });
      }
      console.log(`[AUTH] Wallet ${wallet} verified successfully`);
    } else {
      // Optional: enforce wallet connection if required by policy
      // return NextResponse.json({ error: "Wallet authentication required" }, { status: 401 });
    }

    // Step 1: Generate OTP
    const otp = await generateOtp(userId);
    
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
