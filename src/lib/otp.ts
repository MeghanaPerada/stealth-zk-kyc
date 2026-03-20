// /src/lib/otp.ts
// MongoDB-backed OTP store for persistent serverless verification
import connectDB from './config/db';
import { Otp } from './models/Otp';

/**
 * generateOtp
 * Generates a 6-digit numeric OTP for a given user/session and stores it in MongoDB.
 */
export async function generateOtp(userId: string): Promise<string> {
  await connectDB();
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
  
  // Upsert OTP for the user
  await Otp.findOneAndUpdate(
    { userId },
    { otp, expiresAt },
    { upsert: true, new: true }
  );
  
  return otp;
}

/**
 * verifyOtp
 * Verifies if the provided OTP matches the one in MongoDB and hasn't expired.
 */
export async function verifyOtp(userId: string, otp: string): Promise<boolean> {
  await connectDB();
  const record = await Otp.findOne({ userId });
  
  if (!record) return false;
  
  // Mongoose TTL index handles deletion, but we check just in case
  if (new Date() > record.expiresAt) return false;
  
  const isValid = record.otp === otp;
  
  // Optional: delete after successful verify to prevent reuse
  if (isValid) {
    await Otp.deleteOne({ _id: record._id });
  }
  
  return isValid;
}
