/**
 * zkProofUtils.ts
 *
 * PRIVACY ARCHITECTURE:
 * This module performs ALL sensitive ZK operations on the client device.
 * No personal data leaves the browser at any point.
 *
 * Flow:
 *   Identity inputs → snarkjs.groth16.fullProve() → ZK Proof (stays client-side)
 *   → snarkjs.groth16.verify() → cryptographic validity check (no server call)
 *   → SHA256(proof) + SHA256(signals) → commitment hash (safe to publish)
 *   → commitment anchored on Algorand (immutable, reveals NOTHING about identity)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ZKProof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface ZKArtifacts {
  proof: ZKProof;
  publicSignals: string[];
}

export interface CommitmentResult {
  proofHash: string;
  signalHash: string;
  commitment: string;
}

// ─── Helper: SHA-256 via Web Crypto (browser) or Node crypto ─────────────────

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    // Browser: use WebCrypto (zero server involvement)
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } else {
    // Server/Node fallback (for API routes)
    const { createHash } = await import("crypto");
    return createHash("sha256").update(input).digest("hex");
  }
}

// ─── Client-Side ZK Proof Verification ───────────────────────────────────────

/**
 * verifyProof
 *
 * Verifies a Groth16 ZK proof entirely on the client using snarkjs.
 * The verification key is fetched from /zk/verification_key.json (public, safe).
 * No personal data is transmitted — only the proof and public signals.
 *
 * @param proof       - The Groth16 proof object (pi_a, pi_b, pi_c)
 * @param publicSignals - Array of public output values from the ZK circuit
 * @returns           - true if the proof is cryptographically valid
 */
export async function verifyProof(
  proof: ZKProof,
  publicSignals: string[]
): Promise<boolean> {
  // Fetch verification key from public directory (no secrets here)
  const vKey = await fetch("/zk/verification_key.json").then((res) => {
    if (!res.ok) throw new Error("Failed to load verification key");
    return res.json();
  });

  // @ts-ignore — snarkjs is loaded via <script> tag in browser
  const snarkjs = (window as any).snarkjs;
  if (!snarkjs) throw new Error("snarkjs not loaded. Ensure the script tag is present.");

  // Groth16 verification: checks πA·πB = πC·vk (elliptic curve pairing, done off-chain)
  const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
  return isValid;
}

// ─── Commitment Hash Creation ─────────────────────────────────────────────────

/**
 * createCommitment
 *
 * Creates a privacy-preserving commitment from a ZK proof.
 * The commitment is safe to publish publicly — it reveals NOTHING about the identity.
 *
 * Algorithm:
 *   proofHash  = SHA256(JSON.stringify(proof))
 *   signalHash = SHA256(JSON.stringify(publicSignals))
 *   commitment = SHA256(proofHash + signalHash)
 *
 * This is a binding cryptographic commitment: the prover can't change the proof
 * without changing the commitment, but the verifier learns nothing about the inputs.
 *
 * @param proof         - The ZK proof
 * @param publicSignals - The public outputs of the circuit
 * @returns             - { proofHash, signalHash, commitment }
 */
export async function createCommitment(
  proof: ZKProof,
  publicSignals: string[]
): Promise<CommitmentResult> {
  const proofJson = JSON.stringify(proof);
  const signalJson = JSON.stringify(publicSignals);

  const proofHash = await sha256Hex(proofJson);
  const signalHash = await sha256Hex(signalJson);

  // Final commitment binds both proof and signals into a single hash
  const commitment = await sha256Hex(proofHash + signalHash);

  return { proofHash, signalHash, commitment };
}

// ─── Load ZK Artifacts from localStorage ─────────────────────────────────────

/**
 * loadStoredArtifacts
 *
 * Retrieves ZK proof artifacts from the browser's local storage.
 * These were saved during the proof generation step.
 * No network calls — purely local.
 */
export function loadStoredArtifacts(): ZKArtifacts | null {
  try {
    const raw = localStorage.getItem("stealth_final_proof");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const proof = parsed.proof || parsed.fullProof?.proof;
    const publicSignals = parsed.publicSignals || parsed.fullProof?.publicSignals;
    if (!proof || !publicSignals) return null;
    return { proof, publicSignals };
  } catch {
    return null;
  }
}
