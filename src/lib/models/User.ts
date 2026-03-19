import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  isRegisteredOnChain: boolean;
  kycLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  walletAddress: { type: String, required: true, unique: true },
  isRegisteredOnChain: { type: Boolean, default: false },
  kycLevel: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
