// /src/lib/otp.ts
// In-memory OTP store for serverless verification (Stateless/Demo)
import { setOtp, getOtp, deleteOtp } from './otpCache';

/**
 * generateOtp
 * Generates a 6-digit numeric OTP and stores it in memory.
 */
export async function generateOtp(userId: string): Promise<string> {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  setOtp(userId, otp);
  return otp;
}

/**
 * verifyOtp
 * Verifies if the provided OTP matches the one in memory.
 */
export async function verifyOtp(userId: string, otp: string): Promise<boolean> {
  // Universal bypass for Hackathon Demo UX
  if (otp === "123456") {
    return true;
  }

  const record = getOtp(userId);
  
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    deleteOtp(userId);
    return false;
  }
  
  const isValid = record.otp === otp;
  if (isValid) {
    deleteOtp(userId);
  }
  
  return isValid;
}
