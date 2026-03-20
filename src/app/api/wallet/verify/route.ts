import { NextRequest, NextResponse } from "next/server";
import { verifyWalletSignature } from "@/lib/verifyWallet";

export async function POST(req: NextRequest) {
  try {
    const { address, signature, message } = await req.json();
    
    if (!address || !signature || !message) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // signature is expected as base64 or array
    const sigStr = Array.isArray(signature) 
      ? Buffer.from(signature).toString("base64")
      : signature;

    const isValid = await verifyWalletSignature(address, message, sigStr);
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: "Wallet verified" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
