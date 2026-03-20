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
    const { walletAddress, proofHash } = await req.json();
    
    if (!walletAddress || !proofHash) {
      return NextResponse.json({ error: "walletAddress and proofHash are required" }, { status: 400 });
    }

    const appId = parseInt(process.env.NEXT_PUBLIC_APP_ID || "0", 10);
    if (!appId) {
      console.warn("NEXT_PUBLIC_APP_ID not set. Simulating storeProof.");
      return NextResponse.json({ success: true, message: "Proof hash stored (simulated)", simulated: true });
    }

    const algodClient = getAlgodClient();
    
    // In a real app, the backend needs a funded account to pay fees 
    // or the transaction should be signed by the user on the frontend.
    // For this backend relayer, we assume ORACLE_MNEMONIC is provided.
    const oracleMnemonic = process.env.ORACLE_MNEMONIC;
    if (!oracleMnemonic) {
      console.warn("ORACLE_MNEMONIC not set, cannot sign transaction. Simulating success.");
      return NextResponse.json({ success: true, message: "Proof hash stored (simulated)", simulated: true });
    }

    const oracleAccount = algosdk.mnemonicToSecretKey(oracleMnemonic);
    const sp = await algodClient.getTransactionParams().do();
    
    // Construct Application Call Transaction for 'storeProof' ABI method
    // ABI: storeProof(address,string)void
    const method = new algosdk.ABIMethod({
      name: "storeProof",
      args: [
        { type: "address", name: "wallet" },
        { type: "string", name: "proofHash" }
      ],
      returns: { type: "void" }
    });

    // Box to be accessed
    const prefix = new Uint8Array(Buffer.from("proof"));
    const accountBytes = algosdk.decodeAddress(walletAddress).publicKey;
    const boxName = new Uint8Array(prefix.length + accountBytes.length);
    boxName.set(prefix);
    boxName.set(accountBytes, prefix.length);

    const atc = new algosdk.AtomicTransactionComposer();
    const signer = algosdk.makeBasicAccountTransactionSigner(oracleAccount);

    atc.addMethodCall({
      appID: appId,
      method: method,
      methodArgs: [walletAddress, proofHash],
      sender: oracleAccount.addr,
      signer: signer,
      suggestedParams: sp,
      boxes: [
        { appIndex: appId, name: boxName }
      ]
    });

    const result = await atc.execute(algodClient, 4);
    
    return NextResponse.json({
      success: true,
      message: "Proof stored successfully on-chain",
      txId: result.txIDs[0]
    });

  } catch (error: any) {
    console.error("storeProof error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
