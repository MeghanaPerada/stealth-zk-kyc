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

    // In a real app, this transaction would zero out the expiry box indicating revocation
    // We assume backend relayer for demo purposes, or it should be signed by the user wallet.
    const oracleMnemonic = process.env.ORACLE_MNEMONIC;
    if (!oracleMnemonic) {
      console.warn("ORACLE_MNEMONIC not set, cannot sign transaction. Simulating revocation.");
      return NextResponse.json({ success: true, message: "Consent revoked successfully (simulated)", simulated: true });
    }

    const oracleAccount = algosdk.mnemonicToSecretKey(oracleMnemonic);
    const sp = await algodClient.getTransactionParams().do();
    
    // Construct Application Call Transaction to revoke consent (e.g. set expiry to 0)
    const method = new algosdk.ABIMethod({
      name: "revokeConsent", // Assuming there is a revokeConsent ABI method
      args: [{ type: "address", name: "wallet" }],
      returns: { type: "void" }
    });

    const prefix = new Uint8Array(Buffer.from("expiry"));
    const accountBytes = algosdk.decodeAddress(address).publicKey;
    const boxName = new Uint8Array(prefix.length + accountBytes.length);
    boxName.set(prefix);
    boxName.set(accountBytes, prefix.length);

    const atc = new algosdk.AtomicTransactionComposer();
    const signer = algosdk.makeBasicAccountTransactionSigner(oracleAccount);

    atc.addMethodCall({
      appID: appId,
      method: method,
      methodArgs: [address],
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
      message: "Consent revoked successfully on-chain",
      txId: result.txIDs[0]
    });

  } catch (error: any) {
    console.error("Revoke consent error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
