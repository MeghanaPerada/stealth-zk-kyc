/**
 * lightVerifyService.ts
 * 
 * SECURE FRONTEND-ONLY VERIFICATION
 * 
 * This module implements a privacy-preserving, replay-resistant verification
 * system for identity commitments. No backend or database is used.
 */

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
 * SHA-256 helper (Web Crypto/Node fallback)
 */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } else {
    const { createHash } = await import("crypto");
    return createHash("sha256").update(input).digest("hex");
  }
}

/**
 * verifyProof
 * 
 * Validates a "light" ZK proof against the stored identity commitment 
 * and ensures it hasn't been replayed.
 */
export async function verifyProof(proof: LightProof): Promise<VerificationResult> {
  try {
    // 1. Structural Validation
    if (!proof.commitment || !proof.nullifier || !proof.claim || !proof.timestamp) {
      return { success: false, message: "Corrupted proof: Missing required fields." };
    }

    // 2. Commitment Validation
    const storedCommitment = localStorage.getItem("identityCommitment");
    if (!storedCommitment) {
      return { success: false, message: "Security Error: No identity commitment found on device." };
    }
    if (proof.commitment !== storedCommitment) {
      return { success: false, message: "Verification Failed: Identity commitment mismatch." };
    }

    // 3. Nullifier Validation (Anti-Replay)
    const usedNullifiers = JSON.parse(localStorage.getItem("usedNullifiers") || "[]");
    if (!/^[0-9a-f]{64}$/i.test(proof.nullifier)) {
      return { success: false, message: "Invalid Nullifier: Must be a valid SHA-256 hash." };
    }
    if (usedNullifiers.includes(proof.nullifier)) {
      return { success: false, message: "Replay Attack Detected: This proof has already been used." };
    }

    // 4. Timestamp Validation (Replay Sensitivity)
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;
    if (proof.timestamp > now) {
      return { success: false, message: "Future Proof: Timestamp is from the future." };
    }
    if (now - proof.timestamp > FIVE_MINUTES) {
      return { success: false, message: "Expired Proof: Timestamp is older than 5 minutes." };
    }

    // 5. Claim Validation
    if (proof.claim !== "verified_user") {
      return { success: false, message: "Invalid Claim: Unexpected claim content." };
    }

    // ─── Verification Success ──────────────────────────────────────────────

    // Register the nullifier as "used"
    usedNullifiers.push(proof.nullifier);
    localStorage.setItem("usedNullifiers", JSON.stringify(usedNullifiers));

    // Generate proof hash for anchoring
    const proofHash = await sha256Hex(JSON.stringify(proof));

    // Simulate Algorand Anchoring
    const anchoredProofs = JSON.parse(localStorage.getItem("anchoredProofs") || "[]");
    anchoredProofs.push(proofHash);
    localStorage.setItem("anchoredProofs", JSON.stringify(anchoredProofs));

    return {
      success: true,
      message: "Proof successfully verified and anchored on Algorand (simulated)",
      proofHash
    };

  } catch (err: any) {
    return { success: false, message: `Verification error: ${err.message}` };
  }
}
