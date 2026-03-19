import mongoose, { Schema, Document } from 'mongoose';

export interface IProof extends Document {
  walletAddress: string;
  proofHash: string;
  fullProof?: any; // New field for real PLONK proof data
  txId?: string;
  trustScore: number;
  sourceType: 'MANUAL' | 'DIGILOCKER' | 'ORACLE' | 'MANUAL_ENTRY' | 'UNKNOWN';
  createdAt: Date;
  updatedAt: Date;
}

const ProofSchema: Schema = new Schema({
  walletAddress: { type: String, required: true },
  proofHash: { type: String, required: true, unique: true },
  fullProof: { type: Schema.Types.Mixed }, // Store snarkjs proof structure
  txId: { type: String },
  trustScore: { type: Number, default: 0 },
  sourceType: {
    type: String,
    enum: ['MANUAL', 'DIGILOCKER', 'ORACLE', 'MANUAL_ENTRY', 'UNKNOWN'],
    default: 'UNKNOWN'
  }
}, { timestamps: true });

// Ensure we don't recreate the model if it already exists
export default mongoose.models.Proof || mongoose.model<IProof>('Proof', ProofSchema);
