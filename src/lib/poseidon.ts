// /src/lib/poseidon.ts
// Poseidon hash helper for ZK circuit inputs
// Uses circomlibjs which is already installed in this project

import { buildPoseidon } from "circomlibjs";

// Convert PAN string to a single numeric hash (field-element compatible)
export function panToHash(pan: string): number {
  // Sum of ASCII values * position weight (simple, deterministic, fits in field)
  let hash = 0;
  for (let i = 0; i < pan.length; i++) {
    hash = (hash * 31 + pan.charCodeAt(i)) % 2147483647; // mod prime
  }
  return hash;
}

/**
 * generateIdentityHash
 * Computes Poseidon([dob, aadhaar_last4, panHash]) — must match identityHash.circom exactly.
 * @param dob        - Date of birth as YYYYMMDD integer (e.g. 20030815)
 * @param aadhaarLast4 - Last 4 digits of Aadhaar as integer (e.g. 1234)
 * @param panHash    - Numeric hash of PAN string via panToHash()
 */
export async function generateIdentityHash(
  dob: number,
  aadhaarLast4: number,
  panHash: number
): Promise<string> {
  const poseidon = await buildPoseidon();
  const hash = poseidon([BigInt(dob), BigInt(aadhaarLast4), BigInt(panHash)]);
  return poseidon.F.toString(hash);
}

/**
 * parseDob
 * Converts "YYYY-MM-DD" or "YYYYMMDD" → integer YYYYMMDD
 */
export function parseDob(dob: string | number): number {
  if (typeof dob === "number") return dob;
  const clean = dob.replace(/-/g, "");
  return parseInt(clean, 10);
}
