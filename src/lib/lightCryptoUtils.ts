/**
 * lightCryptoUtils.ts
 * 
 * Shared cryptographic utilities for the light verification and identity modules.
 * Uses Web Crypto API for browser-side performance and security.
 */

/**
 * sha256Hex
 * Computes the SHA-256 hash of a string and returns it as a hex string.
 */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    // Browser: Use Web Crypto API
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } else {
    // Node.js fallback (if needed for testing/SSR)
    const { createHash } = await import("crypto");
    return createHash("sha256").update(input).digest("hex");
  }
}

export interface LightProof {
  commitment: string;   // SHA-256(name + email + secret)
  nullifier: string;    // SHA-256(secret + timestamp)
  claim: string;        // e.g. "verified_user"
  timestamp: number;    // UTC milliseconds
}

export interface VerificationResult {
  success: boolean;
  message: string;
  proofHash?: string;
}

/**
 * generateSecret
 * Generates a cryptographically secure random 32-byte hex string.
 */
export function generateSecret(): string {
  const bytes = new Uint8Array(32);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    // Node.js fallback
    const crypto = require("crypto");
    return crypto.randomBytes(32).toString("hex");
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
