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
      console.warn("NEXT_PUBLIC_APP_ID not set. Simulating reuse limit.");
      return NextResponse.json({ 
        success: true, 
        message: "Proof reused (simulated)", 
        simulated: true, 
        proofHash: "0x"+Buffer.from("simulated_proof_"+Date.now()).toString('hex') 
      });
    }

    const algodClient = getAlgodClient();

    // Check expiry consent box
    const expiryPrefix = new Uint8Array(Buffer.from("expiry"));
    const accountBytes = algosdk.decodeAddress(address).publicKey;
    const expiryBoxName = new Uint8Array(expiryPrefix.length + accountBytes.length);
    expiryBoxName.set(expiryPrefix);
    expiryBoxName.set(accountBytes, expiryPrefix.length);

    try {
      const expiryBox = await algodClient.getApplicationBoxByName(appId, expiryBoxName).do();
      if (expiryBox && expiryBox.value) {
        const expiry = Number(algosdk.decodeUint64(expiryBox.value, "safe"));
        if (expiry < Math.floor(Date.now() / 1000)) {
           return NextResponse.json({ success: false, message: "Consent expired, cannot reuse proof" });
        }
      }
    } catch (boxError: any) {
       if (boxError.status === 404) {
          return NextResponse.json({ success: false, message: "Consent not found, cannot reuse proof" });
       }
       throw boxError;
    }

    // Check proof box
    const proofPrefix = new Uint8Array(Buffer.from("proof"));
    const proofBoxName = new Uint8Array(proofPrefix.length + accountBytes.length);
    proofBoxName.set(proofPrefix);
    proofBoxName.set(accountBytes, proofPrefix.length);

    try {
      const proofBox = await algodClient.getApplicationBoxByName(appId, proofBoxName).do();
      if (proofBox && proofBox.value) {
         let decodedString = "";
         try {
            decodedString = algosdk.ABIType.from("string").decode(proofBox.value).toString();
         } catch(e) {
            decodedString = Buffer.from(proofBox.value).toString("utf8").replace(/\0/g, "").replace(/[^x20-x7E]/g, "");
         }
         return NextResponse.json({ success: true, message: "Proof reused successfully", proofHash: decodedString });
      }
    } catch (boxError: any) {
       if (boxError.status === 404) {
          return NextResponse.json({ success: false, message: "Proof not found on-chain" });
       }
       throw boxError;
    }

    return NextResponse.json({ success: false, message: "Proof not found" });

  } catch (error: any) {
    console.error("Proof reuse error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
