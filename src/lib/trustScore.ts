/**
 * trustScore.ts
 * Shared utility for computing trust scores and proof types.
 * Used by the Oracle API and surfaced in UI.
 */

export type ProofType = "GOVT_GRADE" | "VERIFIED" | "BASIC";

export interface TrustProfile {
  trustScore: number;
  proofType: ProofType;
  proofTypeLabel: string;
  source: "digilocker" | "manual";
  color: "green" | "yellow" | "red";
}

/**
 * Calculate trust score based on data source and validation count.
 * DigiLocker = highest trust (govt-authenticated).
 * Manual = medium/low depending on validations passed.
 */
export function calculateTrustScore(
  source: "digilocker" | "manual",
  validationsPassed: number = 0
): number {
  if (source === "digilocker") return 95;
  if (validationsPassed >= 2) return 70;
  if (validationsPassed === 1) return 45;
  return 30;
}

/**
 * Map a trust score to a proof type classification.
 */
export function getProofType(source: "digilocker" | "manual", trustScore: number): ProofType {
  if (source === "digilocker") return "GOVT_GRADE";
  if (trustScore >= 70) return "VERIFIED";
  return "BASIC";
}

/**
 * Full trust profile in one call.
 */
export function buildTrustProfile(
  source: "digilocker" | "manual",
  validationsPassed: number = 0
): TrustProfile {
  const trustScore = calculateTrustScore(source, validationsPassed);
  const proofType = getProofType(source, trustScore);

  const labels: Record<ProofType, string> = {
    GOVT_GRADE: "🟢 Govt-Grade",
    VERIFIED: "🟡 Verified",
    BASIC: "🔴 Basic",
  };

  const colors: Record<ProofType, "green" | "yellow" | "red"> = {
    GOVT_GRADE: "green",
    VERIFIED: "yellow",
    BASIC: "red",
  };

  return {
    trustScore,
    proofType,
    proofTypeLabel: labels[proofType],
    source,
    color: colors[proofType],
  };
}

/**
 * Minimum trust thresholds per use-case.
 * Applications can enforce these to filter credentials.
 */
export const USE_CASE_TRUST_REQUIREMENTS: Record<string, number> = {
  land: 80,   // Land registration — requires Govt-Grade
  bank: 65,   // Bank KYC — Verified or above
  gov: 80,    // Government benefits — requires Govt-Grade
  college: 60,
  default: 40,
};
