// /src/lib/verifyWallet.ts
// Wallet signature verification utilities for Algorand

import algosdk from "algosdk";

/**
 * verifyWalletSignature
 * Verifies an ed25519 signature from an Algorand wallet.
 * Used to bind ZK proofs to a specific wallet by requiring the user
 * to sign a challenge message before proof generation.
 *
 * @param message   - The original plaintext message that was signed
 * @param signature - Raw signature bytes from wallet
 * @param address   - Algorand wallet address (base32 encoded)
 */
export function verifyWalletSignature(
  message: string,
  signature: Uint8Array,
  address: string
): boolean {
  try {
    const msgBytes = new TextEncoder().encode(message);
    return algosdk.verifyBytes(msgBytes, signature, address);
  } catch {
    return false;
  }
}

/**
 * generateChallenge
 * Generates a deterministic challenge string for wallet signing.
 * Include wallet + timestamp so it's replay-resistant.
 */
export function generateChallenge(wallet: string, timestamp: number): string {
  return `stealth-zk-kyc:verify:${wallet}:${timestamp}`;
}
