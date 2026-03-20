// /src/lib/oracleMock.ts
// Simulated Oracle to generate and sign KYC data

import crypto from "crypto";
import { parseDobToInt, panToAscii } from "./helpers";

const ORACLE_SECRET = process.env.ORACLE_SECRET || "stealth_zk_kyc_secret_12345";

/**
 * generateDynamicKYC
 * Generates a mock KYC result with a digital signature (HMAC).
 * Supports both manual data and randomized demo data.
 */
export function generateDynamicKYC(manualData?: any) {
  // Use manual data if provided, otherwise default to a demo user
  const pii = manualData || {
    name: "Demo User",
    dob: "2003-08-15",
    aadhaar_last4: "1234",
    pan: "ABCDE1234F",
    city: "New Delhi",
    state: "Delhi",
    issuer: "UIDAI"
  };

  // 1. Create Data Hash (for the whole PII record)
  const dataString = JSON.stringify(pii);
  const dataHash = crypto.createHash("sha256").update(dataString).digest("hex");

  // 2. Generate HMAC Signature (mimics a professional Oracle signature)
  const signature = crypto.createHmac("sha256", ORACLE_SECRET)
    .update(dataHash)
    .digest("hex");

  // 3. Return structured result
  return {
    data: pii,
    dataHash,
    signature,
    issuer: pii.issuer || "DynamicOracle",
    _internalData: pii // Keep a raw copy for ZK processing
  };
}
