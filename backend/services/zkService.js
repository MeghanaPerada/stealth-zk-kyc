const crypto = require('crypto');

/**
 * Simulated service to generate a Zero-Knowledge Proof based on user attributes
 */
const generateProof = (attributes) => {
  const proof = {
    publicSignals: {
      isAdult: attributes.age >= 18,
      isVerified: attributes.isPanValid,
      trustScore: attributes.trustScore || 0.0,
      sourceType: attributes.sourceType || 'UNKNOWN',
      walletAddress: attributes.walletAddress
    },
    timestamp: new Date().toISOString(),
    salt: crypto.randomBytes(16).toString('hex')
  };

  // Generate a hash of the proof object for integrity
  const proofHash = crypto.createHash('sha256')
    .update(JSON.stringify(proof))
    .digest('hex');
  
  return {
    ...proof,
    proofHash: `prf_${proofHash}`
  };
};

/**
 * Simulated service to verify a Zero-Knowledge Proof using hash integrity
 */
const verifyProof = (proof) => {
  if (!proof || !proof.proofHash) {
    return false;
  }
  
  // Extract hash and verify integrity
  const { proofHash, ...proofData } = proof;
  const recalculatedHash = `prf_${crypto.createHash('sha256')
    .update(JSON.stringify(proofData))
    .digest('hex')}`;
  
  const isHashValid = proofHash === recalculatedHash;
  const areSignalsValid = proof.publicSignals && 
                          proof.publicSignals.isAdult === true && 
                          proof.publicSignals.isVerified === true;

  console.log(`[DEBUG] Verification: HashValid=${isHashValid}, SignalsValid=${areSignalsValid}`);
  
  return isHashValid && areSignalsValid;
};

module.exports = {
  generateProof,
  verifyProof
};
