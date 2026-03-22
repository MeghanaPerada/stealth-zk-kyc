import { NextRequest, NextResponse } from "next/server";
import algosdk from "algosdk";

function getAlgodClient() {
  const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "a".repeat(64);
  const server = process.env.NEXT_PUBLIC_ALGOD_SERVER || "http://localhost";
  const port = process.env.NEXT_PUBLIC_ALGOD_PORT || "4001";
  return new algosdk.Algodv2(token, server, port);
}

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    const appId = parseInt(process.env.NEXT_PUBLIC_APP_ID || "0", 10);
    if (!appId) {
      console.warn("NEXT_PUBLIC_APP_ID not set. Simulating consent revocation.");
      return NextResponse.json({ success: true, message: "Consent revoked successfully (simulated)", simulated: true });
    }

    const algodClient = getAlgodClient();

    // --- SELF-ANCHORING REFACTOR ---
    // The backend no longer has a mnemonic to sign transactions.
    // Consent revocation must be triggered by the user's wallet directly on-chain.
    console.warn("Backend-initiated revocation is disabled for security. Use the frontend wallet to call revokeConsent.");
    return NextResponse.json({ 
      success: false, 
      error: "Revocation must be performed by the user's wallet directly on-chain.",
      actionRequired: "wallet_signature"
    }, { status: 403 });

  } catch (error: any) {
    console.error("Revoke consent error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
