const mongoose = require('mongoose');

const ProofSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    index: true,
  },
  proofHash: {
    type: String,
    required: true,
    unique: true,
  },
  txId: {
    type: String,
    // Transaction ID if posted on-chain later
  },
  trustScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1.0,
  },
  sourceType: {
    type: String,
    required: true,
    enum: ['DIGILOCKER', 'MANUAL', 'MANUAL_ENTRY', 'ORACLE', 'UNKNOWN'],
  },
}, { timestamps: true });

module.exports = mongoose.model('Proof', ProofSchema);
