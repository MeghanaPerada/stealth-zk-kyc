// /src/lib/helpers.ts
// Shared utility helpers for ZK circuit input preparation

/**
 * panToAscii
 * Converts a 10-char PAN string into a fixed-length ASCII array (padded with 0s).
 * Used as raw circuit input when the circuit expects per-character ASCII values.
 */
export const panToAscii = (pan: string): number[] => {
  const ascii = new Array(10).fill(0);
  for (let i = 0; i < Math.min(pan.length, 10); i++) {
    ascii[i] = pan.charCodeAt(i);
  }
  return ascii;
};

/**
 * parseDobToInt
 * Accepts "YYYY-MM-DD", "YYYYMMDD", or an integer.
 * Returns YYYYMMDD as an integer (matches circuit expectation).
 */
export const parseDobToInt = (dob: string | number): number => {
  if (typeof dob === "number") return dob;
  return parseInt(dob.replace(/-/g, ""), 10);
};

/**
 * extractBirthYear
 * Extracts the 4-digit birth year from a YYYYMMDD integer.
 * Used for the age verification constraint: currentYear - birthYear >= 18
 */
export const extractBirthYear = (dobInt: number): number => {
  return Math.floor(dobInt / 10000);
};

/**
 * generateProofId
 * Creates a human-readable proof identifier from a hash and timestamp.
 */
export const generateProofId = (hash: string): string => {
  return `zkp_${hash.substring(0, 12).toUpperCase()}`;
};

/**
 * truncate
 * Truncates a long string for display.
 */
export const truncate = (str: string, len = 12): string => {
  if (!str) return "";
  return str.length <= len * 2 + 3 ? str : `${str.substring(0, len)}...${str.substring(str.length - len)}`;
};
