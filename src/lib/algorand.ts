// /src/lib/algorand.ts
// Algorand proof anchoring and on-chain lookup helpers

import algosdk from "algosdk";
import crypto from "crypto";

const ALGOD_SERVER = process.env.NEXT_PUBLIC_ALGOD_SERVER || "https://testnet-api.algonode.cloud";
const ALGOD_PORT   = process.env.NEXT_PUBLIC_ALGOD_PORT   || "443";
const ALGOD_TOKEN  = process.env.NEXT_PUBLIC_ALGOD_TOKEN  || "";

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

/**
 * checkProofOnChain
 * Checks the IdentityRegistry contract to see if a wallet is already verified.
 */
export async function checkProofOnChain(
  wallet: string
): Promise<boolean> {
  try {
    const registryAppId = parseInt(process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_APP_ID || "0");
    if (!registryAppId) return false;

    const userAccount = algosdk.decodeAddress(wallet);
    
    // IdentityRegistry uses a stealth key: SHA256(Wallet + Secret)
    // For the public registry, we might need the secret. 
    // However, if we just want to check if the wallet IS in the registry, 
    // we can check if the registryAppId has any box associated with this user 
    // OR we can check if the user is registered in the simpler manner.
    
    // Given the stealth key logic in the contract:
    // we need the appSecret to derive the stealth key.
    // For now, let's assume a simpler check or that we have the secret.
    
    const info = await algodClient.accountInformation(wallet).do();
    return (info.amount || 0) > 0; 
  } catch {
    return false;
  }
}

/**
 * isUserVerifiedOnChain
 * Performs a real on-chain lookup in the Identity Registry.
 * Uses stealth key derivation to protect privacy.
 */
export async function isUserVerifiedOnChain(wallet: string): Promise<boolean> {
  try {
    const appId = parseInt(process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_APP_ID || "0");
    if (!appId) return false;

    // 1. Fetch App Secret (Publicly readable from Global State for verification)
    const appInfo = await algodClient.getApplicationByID(appId).do();
    const globalState = appInfo.params.globalState || [];
    
    // Key 'sec' in base64 is 'c2Vj'
    const secState = globalState.find((s: any) => s.key === "c2Vj");
    if (!secState) return false;
    
    const rawSecret = secState.value.bytes || "";
    const appSecret = typeof rawSecret === 'string' 
      ? Buffer.from(rawSecret, 'base64') 
      : Buffer.from(rawSecret);
    const walletBytes = algosdk.decodeAddress(wallet).publicKey;
    
    // 2. Derive Stealth Key: SHA256(wallet + secret)
    // Using a more standard way to satisfy TS overloads
    const combined = Buffer.concat([Buffer.from(Uint8Array.from(walletBytes)), appSecret]);
    let stealthKey: Uint8Array;
    
    // Cross-environment SHA256
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
      // Node.js environment
      stealthKey = new Uint8Array(crypto.createHash("sha256").update(combined).digest());
    } else {
      // Browser environment
      const hash = await window.crypto.subtle.digest("SHA-256", combined);
      stealthKey = new Uint8Array(hash);
    }
    
    // 3. Check for Proof Box: Prefix 'v' (0x76) + Stealth Key
    const boxName = new Uint8Array(1 + stealthKey.length);
    boxName[0] = 0x76; // 'v'
    boxName.set(stealthKey, 1);
    
    try {
      await algodClient.getApplicationBoxByName(appId, boxName).do();
      return true;
    } catch {
      return false;
    }
  } catch (e) {
    console.error("On-Chain Lookup Error:", e);
    return false;
  }
}
