/**
 * lightIdentityService.ts
 * 
 * Logic for generating identity commitments and simulated ZK proofs.
 * Ensures privacy by using SHA-256 commitments and unique nullifiers.
 */

import { sha256Hex, generateSecret, type LightProof } from "@/lib/lightCryptoUtils";

/**
 * generateIdentityCommitment
 * 
 * Creates a unique identity anchor: SHA-256(name + email + secret).
 * The name and email are never stored after this step.
 */
export async function generateIdentityCommitment(
  name: string,
  email: string,
  secret: string
): Promise<string> {
  const preImage = `${name.trim().toLowerCase()}:${email.trim().toLowerCase()}:${secret}`;
  return await sha256Hex(preImage);
}

/**
 * createLightProof
 * 
 * Generates a unique, simulated ZK proof using a fresh nullifier.
 * The nullifier is computed as SHA-256(secret + timestamp).
 */
export async function createLightProof(
  secret: string,
  commitment: string
): Promise<LightProof> {
  const timestamp = Date.now();
  const nullifierPreImage = `${secret}:${timestamp}`;
  const nullifier = await sha256Hex(nullifierPreImage);

  return {
    commitment,
    nullifier,
    claim: "verified_user",
    timestamp
  };
}
