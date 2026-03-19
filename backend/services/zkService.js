const crypto = require('crypto');

/**
 * Simulated service to generate a Zero-Knowledge Proof based on user attributes
 */
const generateProof = (attributes) => {
  const payload = JSON.stringify(attributes);
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  
  return {
    proofContent: `proof_of_kyc_${hash.substring(0, 16)}`,
    publicSignals: {
      isAdult: attributes.age >= 18,
      isVerified: attributes.isPanValid,
      trustScore: attributes.trustScore || 0.0,
      sourceType: attributes.sourceType || 'UNKNOWN'
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Simulated service to verify a Zero-Knowledge Proof
 */
const verifyProof = (proof) => {
  if (!proof || !proof.proofContent || !proof.proofContent.startsWith('proof_of_kyc_')) {
    return false;
  }
  
  if (proof.publicSignals) {
    return proof.publicSignals.isAdult === true && proof.publicSignals.isVerified === true;
  }
  
  return false;
};

module.exports = {
  generateProof,
  verifyProof
};
