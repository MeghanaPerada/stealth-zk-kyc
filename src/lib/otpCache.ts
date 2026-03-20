// src/lib/otpCache.ts
// Simple in-memory cache for demo purposes to avoid MongoDB dependency in Vercel.

interface OTPRecord {
  otp: string;
  expiresAt: number;
}

const otpStore = new Map<string, OTPRecord>();

export function setOtp(key: string, otp: string, ttlMs: number = 5 * 60 * 1000) {
  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + ttlMs,
  });
}

export function getOtp(key: string): OTPRecord | undefined {
  return otpStore.get(key);
}

export function deleteOtp(key: string) {
  otpStore.delete(key);
}
