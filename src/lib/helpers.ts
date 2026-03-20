// Shared utility helpers for ZK circuit input preparation

const nodeCrypto = require("crypto");

/**
 * generateProofIdentifier
 * Creates a dynamic proof ID bound to wallet, proof type, status, and timestamp.
 */
async function generateProofIdentifier(
  wallet: string,
  proofType: "manual" | "digilocker",
  status: "approved" | "rejected",
  timestamp: number
): Promise<string> {
  const { buildPoseidon } = require("circomlibjs");
  const poseidon = await buildPoseidon();
  
  // Create a numeric representation of the wallet for the hash
  const walletNumeric = BigInt(Buffer.from(wallet).reduce((acc, b) => acc + b, 0));
  
  const preImage = [
    walletNumeric,
    proofType === "manual" ? 1n : 2n,
    status === "approved" ? 1n : 0n,
    BigInt(timestamp)
  ];
  
  const hash = poseidon(preImage);
  return poseidon.F.toString(hash);
}

/**
 * hashData
 */
function hashData(data: any): string {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return nodeCrypto.createHash("sha256").update(str).digest("hex");
}

/**
 * panToAscii
 */
const panToAscii = (pan: string): number[] => {
  const ascii = new Array(10).fill(0);
  for (let i = 0; i < Math.min(pan.length, 10); i++) {
    ascii[i] = pan.charCodeAt(i);
  }
  return ascii;
};

/**
 * parseDobToInt
 */
const parseDobToInt = (dob: string | number): number => {
  if (typeof dob === "number") return dob;
  return parseInt(dob.replace(/-/g, ""), 10);
};

/**
 * extractBirthYear
 */
const extractBirthYear = (dobInt: number): number => {
  return Math.floor(dobInt / 10000);
};

/**
 * generateProofId
 */
const generateProofId = (hash: string): string => {
  return `zkp_${hash.substring(0, 12).toUpperCase()}`;
};

/**
 * truncate
 */
const truncate = (str: string, len = 12): string => {
  if (!str) return "";
  return str.length <= len * 2 + 3 ? str : `${str.substring(0, len)}...${str.substring(str.length - len)}`;
};

module.exports = {
  generateProofIdentifier,
  hashData,
  panToAscii,
  parseDobToInt,
  extractBirthYear,
  generateProofId,
  truncate,
};
