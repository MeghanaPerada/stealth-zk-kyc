/**
 * otpHmac.ts
 * Stateless HMAC-based OTP signing utility.
 * Works perfectly in serverless/Vercel environments — no shared memory required.
 */
import { createHmac } from "crypto";

const OTP_SECRET = process.env.OTP_HMAC_SECRET || "stealth-zk-kyc-otp-secret-2024";

/**
 * Sign an OTP for a given key + expiry using HMAC-SHA256.
 * Returns a base64 signature string.
 */
export function signOtp(key: string, otp: string, expiresAt: number): string {
  const payload = `${key}|${otp}|${expiresAt}`;
  return createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
}

/**
 * Verify that the provided OTP matches the signature and hasn't expired.
 */
export function verifyOtpSignature(
  key: string,
  otp: string,
  expiresAt: number,
  signature: string
): boolean {
  if (Date.now() > expiresAt) return false; // expired
  const expected = signOtp(key, otp, expiresAt);
  return expected === signature;
}
