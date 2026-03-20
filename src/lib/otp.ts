// /src/lib/otp.ts
// In-memory OTP store for consent simulation

const otpStore: Record<string, { otp: string; expires: number }> = {};

/**
 * generateOtp
 * Generates a 6-digit numeric OTP for a given user/session.
 */
export function generateOtp(userId: string): string {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + 5 * 60 * 1000; // valid for 5 mins
  otpStore[userId] = { otp, expires };
  return otp;
}

/**
 * verifyOtp
 * Verifies if the provided OTP matches and hasn't expired.
 */
export function verifyOtp(userId: string, otp: string): boolean {
  const record = otpStore[userId];
  if (!record) return false;
  if (Date.now() > record.expires) return false;
  return record.otp === otp;
}
