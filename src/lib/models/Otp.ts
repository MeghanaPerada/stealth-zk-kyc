import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  userId: string;
  otp: string;
  expiresAt: Date;
}

const OtpSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: '5m' } } // Auto-delete after 5 mins
}, { timestamps: true });

// Check if model already exists to prevent overwrite in hot reload
export const Otp = mongoose.models.Otp || mongoose.model<IOtp>('Otp', OtpSchema);
