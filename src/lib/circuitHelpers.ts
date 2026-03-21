/**
 * circuitHelpers.ts
 * Utility for generating Poseidon hashes matching the Circom circuit.
 * Uses circomlibjs for cryptographic consistency.
 */

import { buildPoseidon } from "circomlibjs";

let poseidonInstance: any = null;

async function getPoseidon() {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
}

/**
 * toFieldElement
 * Normalizes any string/number into a valid BN128 Field Element for Poseidon.
 */
export function toFieldElement(input: string | number): bigint {
  const hex = typeof input === "number" 
    ? input.toString(16) 
    : Buffer.from(input.toString()).toString("hex");
    
  return BigInt("0x" + hex.slice(0, 60)) % BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
}

/**
 * calculateIdentityHash
 * Computes Poseidon(dob, aadhaar4, pan_hash, wallet_numeric)
 */
export async function calculateIdentityHash(
  dob: number,
  aadhaar4: number,
  panHashNumeric: bigint,
  walletAddress: string
): Promise<string> {
  const poseidon = await getPoseidon();
  
  // Wallet to field element
  const walletNumeric = toFieldElement(walletAddress);

  const hash = poseidon([
    BigInt(dob),
    BigInt(aadhaar4),
    panHashNumeric,
    walletNumeric
  ]);
  
  return poseidon.F.toString(hash);
}

/**
 * calculateConsentHash
 */
export async function calculateConsentHash(data: string): Promise<string> {
  const poseidon = await getPoseidon();
  const dataNumeric = toFieldElement(data);
  const hash = poseidon([dataNumeric]);
  return poseidon.F.toString(hash);
}
