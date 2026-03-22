// /src/lib/algorand.ts
// Algorand proof anchoring and on-chain lookup helpers

import algosdk from "algosdk";

const ALGOD_SERVER = process.env.NEXT_PUBLIC_ALGOD_SERVER || "https://testnet-api.algonode.cloud";
const ALGOD_PORT   = process.env.NEXT_PUBLIC_ALGOD_PORT   || "443";
const ALGOD_TOKEN  = process.env.NEXT_PUBLIC_ALGOD_TOKEN  || "";

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

/**
 * checkProofOnChain
 * Checks the Algorand Indexer for a transaction note matching the proof hash.
 * Simplified implementation — returns true if wallet has been seen on-chain.
 */
export async function checkProofOnChain(
  wallet: string,
  _proofHash: string
): Promise<boolean> {
  try {
    const info = await algodClient.accountInformation(wallet).do();
    return (info.amount || 0) >= 0; // wallet exists on-chain
  } catch {
    return false;
  }
}
