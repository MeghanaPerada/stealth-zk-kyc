// /src/lib/algorand.ts
// Algorand proof anchoring and on-chain lookup helpers

import algosdk from "algosdk";

const ALGOD_SERVER = process.env.NEXT_PUBLIC_ALGOD_SERVER || "https://testnet-api.algonode.cloud";
const ALGOD_PORT = process.env.NEXT_PUBLIC_ALGOD_PORT || "443";
const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

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
    
    let appSecret: Uint8Array = new Uint8Array(0);
    if (secState && secState.value && secState.value.bytes) {
      const rawSecret = secState.value.bytes;
      appSecret = typeof rawSecret === 'string'
        ? algosdk.base64ToBytes(rawSecret)
        : (rawSecret as Uint8Array);
    }
    
    const walletBytes = algosdk.decodeAddress(wallet).publicKey;

    // 2. Derive Stealth Key: SHA256(wallet + secret)
    // 100% browser-safe concatenation using Uint8Array
    const combined = new Uint8Array(walletBytes.length + appSecret.length);
    combined.set(walletBytes);
    combined.set(appSecret, walletBytes.length);
    let stealthKey: Uint8Array;

    // Cross-environment SHA256
    if (typeof window === "undefined") {
      // Node.js environment
      const c = require("crypto");
      stealthKey = new Uint8Array(c.createHash("sha256").update(combined).digest());
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
