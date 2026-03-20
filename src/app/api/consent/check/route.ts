import { NextRequest, NextResponse } from "next/server";
import algosdk from "algosdk";

// Standard Algorand Client setup using environment variables or defaults
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
      // If no smart contract deployed yet, gracefully return false or simulated true for demo robustness
      console.warn("NEXT_PUBLIC_APP_ID not set. Simulating consent check.");
      return NextResponse.json({ consent_granted: false, message: "App ID not configured" });
    }

    const algodClient = getAlgodClient();

    // The BoxMap keyPrefix in KycAnchor is "expiry"
    const prefix = new Uint8Array(Buffer.from("expiry"));
    const accountBytes = algosdk.decodeAddress(address).publicKey;
    const boxName = new Uint8Array(prefix.length + accountBytes.length);
    boxName.set(prefix);
    boxName.set(accountBytes, prefix.length);

    try {
      const box = await algodClient.getApplicationBoxByName(appId, boxName).do();
      
      if (box && box.value) {
        // Deserialize uint64
        const expiry = Number(algosdk.decodeUint64(box.value, "safe"));
        const currentTimestamp = Math.floor(Date.now() / 1000);
        
        if (expiry > currentTimestamp) {
          return NextResponse.json({ consent_granted: true, expiry });
        } else {
          return NextResponse.json({ consent_granted: false, message: "Consent expired" });
        }
      }
    } catch (boxError: any) {
      // If the box does not exist, it throws a 404
      if (boxError.status === 404) {
         return NextResponse.json({ consent_granted: false, message: "Consent not found" });
      }
      throw boxError;
    }

    return NextResponse.json({ consent_granted: false });

  } catch (error: any) {
    console.error("Consent check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
