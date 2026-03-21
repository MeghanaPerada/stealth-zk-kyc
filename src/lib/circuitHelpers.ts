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
 * Pack a Groth16 proof into 256 bytes for Algorand.
 * Format: [pi_a[0], pi_a[1], pi_b[0][0], pi_b[0][1], pi_b[1][0], pi_b[1][1], pi_c[0], pi_c[1]]
 */
export function packProofBytes(proof: any): Uint8Array {
  const points = [
    proof.pi_a[0], proof.pi_a[1],
    proof.pi_b[0][1], proof.pi_b[0][0], // SnarkJS B is swapped compared to some others, but we follow its output
    proof.pi_b[1][1], proof.pi_b[1][0],
    proof.pi_c[0], proof.pi_c[1]
  ];
  
  const res = new Uint8Array(points.length * 32);
  points.forEach((p, i) => {
    const b = BigInt(p).toString(16).padStart(64, '0');
    for (let j = 0; j < 32; j++) {
      res[i * 32 + j] = parseInt(b.slice(j * 2, j * 2 + 2), 16);
    }
  });
  return res;
}

/**
 * Pack public signals into a single Uint8Array.
 */
export function packPublicSignals(signals: string[]): Uint8Array {
  const res = new Uint8Array(signals.length * 32);
  signals.forEach((s, i) => {
    const b = BigInt(s).toString(16).padStart(64, '0');
    for (let j = 0; j < 32; j++) {
      res[i * 32 + j] = parseInt(b.slice(j * 2, j * 2 + 2), 16);
    }
  });
  return res;
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
