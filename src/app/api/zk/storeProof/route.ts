import { NextRequest, NextResponse } from "next/server";
import algosdk from "algosdk";

// Placeholder setup for algodClient
function getAlgodClient() {
  const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "a".repeat(64);
  const server = process.env.NEXT_PUBLIC_ALGOD_SERVER || "http://localhost";
  const port = process.env.NEXT_PUBLIC_ALGOD_PORT || "4001";
  return new algosdk.Algodv2(token, server, port);
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, proofHash, oracleSignature } = await req.json();
    
    if (!walletAddress || !proofHash || !oracleSignature) {
      return NextResponse.json({ error: "walletAddress, proofHash, and oracleSignature are required" }, { status: 400 });
    }

    const appId = parseInt(process.env.NEXT_PUBLIC_APP_ID || "0", 10);
    if (!appId) {
      console.warn("NEXT_PUBLIC_APP_ID not set. Simulating storeProof.");
      return NextResponse.json({ success: true, message: "Proof hash stored (simulated)", simulated: true });
    }

    const algodClient = getAlgodClient();
    
    // In a real app, the backend needs a funded account to pay fees 
    const oracleMnemonic = process.env.ORACLE_MNEMONIC;
    if (!oracleMnemonic) {
      console.warn("ORACLE_MNEMONIC not set, cannot sign transaction. Simulating success.");
      return NextResponse.json({ success: true, message: "Proof hash stored (simulated)", simulated: true });
    }

    const oracleAccount = algosdk.mnemonicToSecretKey(oracleMnemonic);
    const sp = await algodClient.getTransactionParams().do();
    
    // Construct Application Call Transaction for 'storeProof' ABI method
    // ABI: storeProof(address,byte[],byte[][],byte[][])void
    const method = new algosdk.ABIMethod({
      name: "storeProof",
      args: [
        { type: "address", name: "wallet" },
        { type: "byte[]", name: "proofHash" },
        { type: "byte[][]", name: "oraclePubKeysInputs" },
        { type: "byte[][]", name: "oracleSignaturesInputs" }
      ],
      returns: { type: "void" }
    });

    // Boxes to be accessed (Required for AVM 8+)
    const accountBytes = algosdk.decodeAddress(walletAddress).publicKey;
    
    // 1. Proof Box: prefix "proof" + wallet
    const proofBox = new Uint8Array([..."proof".split("").map(c => c.charCodeAt(0)), ...accountBytes]);
    
    // 2. Expiry Box (for hasValidConsent check): prefix "expiry" + wallet
    const expiryBox = new Uint8Array([..."expiry".split("").map(c => c.charCodeAt(0)), ...accountBytes]);
    
    // 3. Oracle Authorized Box (for signature check in M-of-N): prefix "ao" + pubKey
    const oraclePubKeyBytes = oracleAccount.sk.slice(32, 64);
    const aoBox = new Uint8Array([..."ao".split("").map(c => c.charCodeAt(0)), ...oraclePubKeyBytes]);

    // Prepare Arguments as Uint8Arrays
    const proofHashBytes = Buffer.from(BigInt(proofHash).toString(16).padStart(64, "0"), "hex");
    const oracleSignatureBytes = Buffer.from(oracleSignature, "hex");

    const atc = new algosdk.AtomicTransactionComposer();
    const signer = algosdk.makeBasicAccountTransactionSigner(oracleAccount);

    atc.addMethodCall({
      appID: appId,
      method: method,
      methodArgs: [
        walletAddress, 
        proofHashBytes, 
        [oraclePubKeyBytes],      // Array of Pks
        [oracleSignatureBytes]    // Array of Signatures
      ],
      sender: oracleAccount.addr,
      signer: signer,
      suggestedParams: sp,
      boxes: [
        { appIndex: appId, name: proofBox },
        { appIndex: appId, name: expiryBox },
        { appIndex: appId, name: aoBox }
      ]
    });

    const result = await atc.execute(algodClient, 4);
    
    return NextResponse.json({
      success: true,
      message: "Proof stored successfully on-chain (Verified by M-of-N consensus)",
      txId: result.txIDs[0]
    });

  } catch (error: any) {
    console.error("storeProof error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
