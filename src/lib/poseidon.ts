// /src/lib/poseidon.ts
// Poseidon hash helper for ZK circuit inputs

/**
 * panToHash
 * Convert PAN string to a single numeric hash (field-element compatible)
 */
export function panToHash(pan: string): number {
  let hash = 0;
  for (let i = 0; i < pan.length; i++) {
    hash = (hash * 31 + pan.charCodeAt(i)) % 2147483647; // mod prime
  }
  return hash;
}

/**
 * generateIdentityHash
 * Computes Poseidon([dob, aadhaar_last4, panHash]) — must match identityHash.circom exactly.
 */
export async function generateIdentityHash(
  dob: number,
  aadhaarLast4: number,
  panHash: number
): Promise<string> {
  const { buildPoseidon } = require("circomlibjs");
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
