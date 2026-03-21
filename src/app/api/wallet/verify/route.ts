import { NextRequest, NextResponse } from "next/server";
import { verifyWalletSignature } from "@/lib/verifyWallet";
import { consumeNonce } from "@/lib/nonceCache";

export async function POST(req: NextRequest) {
  try {
    const { address, signature, message } = await req.json();
    
    if (!address || !signature || !message) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Validate and consume the nonce (challenge message)
    const isNonceValid = consumeNonce(message, address);
    if (!isNonceValid) {
      return NextResponse.json({ 
        verified: false, 
        error: "Invalid or expired challenge. Replay attack detected or session expired." 
      }, { status: 401 });
    }

    // 2. signature is expected as base64 or array
    const sigStr = Array.isArray(signature) 
      ? Buffer.from(signature).toString("base64")
      : signature;

    const isValid = await verifyWalletSignature(address, message, sigStr);
    
    if (!isValid) {
      return NextResponse.json({ verified: false, error: "Invalid signature" }, { status: 401 });
    }

    return NextResponse.json({ success: true, verified: true, message: "Wallet verified" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
