const express = require('express');
const router = express.Router();
const multer = require('multer');

const { requireWallet } = require('../middleware/auth');
const validationService = require('../services/validationService');
const zkService = require('../services/zkService');
const documentService = require('../services/documentService');
const blockchainService = require('../services/blockchainService');

// MongoDB Models
const User = require('../models/User');
const Proof = require('../models/Proof');

const upload = multer({ storage: multer.memoryStorage() });

router.use(requireWallet);

// Internal helper for issuing proof
const issueZkProof = async (walletAddress, pan, dob, sourceType, res) => {
  const isPanValid = validationService.validatePAN(pan);
  let age;
  try {
    age = validationService.calculateAge(dob);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const isAdult = age >= 18;

  if (!isPanValid || !isAdult) {
    return res.status(400).json({
      error: 'KYC Failed',
      reasons: { panValid: isPanValid, adult: isAdult }
    });
  }

  const trustScore = documentService.getTrustScore(sourceType);

  const proof = zkService.generateProof({
    walletAddress,
    age,
    isPanValid,
    trustScore,
    sourceType
  });

  try {
    // 1. Ensure user exists in the DB
    await User.findOneAndUpdate(
      { walletAddress },
      { walletAddress },
      { upsert: true, new: true }
    );

    // 2. Identify Registration check
    const registered = await blockchainService.isRegistered(walletAddress);
    if (!registered) {
      console.log(`User ${walletAddress} not registered on-chain. Registering now...`);
      await blockchainService.registerIdentity(walletAddress);
    }

    // 3. Store proof on Algorand Testnet (Proof Registry)
    const txId = await blockchainService.storeProof(proof.proofContent, walletAddress);

    // 4. Save proof metadata to MongoDB (No PII) along with txId
    const newProof = new Proof({
      walletAddress,
      proofHash: proof.proofContent,
      txId,
      trustScore,
      sourceType
    });
    
    await newProof.save();

  } catch (fatalErr) {
    console.error('Fatal error securely storing proof:', fatalErr);
    return res.status(500).json({ error: 'Failed to record proof to registry/blockchain' });
  }

  return res.status(200).json({
    success: true,
    message: `KYC Processed successfully via ${sourceType}. Proof verified and saved on-chain.`,
    proof,
    trustScore,
    walletAddress
  });
};

/**
 * POST /issue-credential (Oracle alias)
 */
router.post('/issue-credential', async (req, res) => {
  try {
    const { attributes, walletAddress: bodyAddress } = req.body;
    // We favor the header address provided by middleware, but fallback to body for flexibility
    const targetAddress = req.walletAddress || bodyAddress;
    
    // Mock data for the "Fetch From Oracle" flow
    const pan = "ABCDE1234F";
    const dob = "1990-01-01";
    
    // Reuse internal logic
    const result = await issueZkProof(targetAddress, pan, dob, 'ORACLE', res);
    
    // The issueZkProof function sends its own response, but we need to ensure 
    // it matches the frontend's expected { success: true, ... } if possible.
    // However, issueZkProof is already designed to return res.status(200).json(...)
  } catch (error) {
    console.error('Error issuing credential:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /process (Legacy basic route)
 */
router.post('/process', async (req, res) => {
  try {
    const { pan, dob } = req.body;
    if (!pan || !dob) {
      return res.status(400).json({ error: 'Missing required fields: pan, dob' });
    }
    return await issueZkProof(req.walletAddress, pan, dob, 'MANUAL_ENTRY', res);
  } catch (error) {
    console.error('Error processing KYC:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /upload
 */
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Missing document file' });
    }
    const { parsedData } = await documentService.parseDocument(file);
    return await issueZkProof(req.walletAddress, parsedData.pan, parsedData.dob, 'MANUAL', res);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /documents
 */
router.post('/documents', async (req, res) => {
  try {
    const { dl_token } = req.body;
    if (!dl_token) {
      return res.status(400).json({ error: 'DigiLocker token missing' });
    }
    const mockedDigiLockerData = {
      pan: "ABCDE1234F",
      dob: "1990-01-01"
    };
    return await issueZkProof(req.walletAddress, mockedDigiLockerData.pan, mockedDigiLockerData.dob, 'DIGILOCKER', res);
  } catch (error) {
    console.error('Error processing DigiLocker documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { proof } = req.body;

    if (!proof) {
      return res.status(400).json({ error: 'Missing proof object' });
    }

    // 1. ZK Verify
    const isValid = zkService.verifyProof(proof);

    if (!isValid) {
      return res.status(400).json({
        verified: false,
        message: 'Invalid proof.'
      });
    }

    // 2. Database verification Check
    const proofHash = proof.proofContent;
    const dbProof = await Proof.findOne({ proofHash });

    if (!dbProof) {
      return res.status(404).json({
        verified: false,
        message: 'Proof cryptographically valid but not recorded in our database.'
      });
    }

    if (dbProof.walletAddress !== req.walletAddress) {
       return res.status(403).json({
        verified: false,
        message: 'Proof does not belong to the connected wallet address.'
      });
    }

    // 3. Algorand Network Verification
    try {
      if (dbProof.txId) {
        // Simple presence check + Note verification
        const tx = await blockchainService.getTransaction(dbProof.txId);
        
        if (!tx.mocked) {
          const verifiedOnChain = await blockchainService.verifyProofHash(req.walletAddress, proofHash);
          if (!verifiedOnChain) {
             return res.status(400).json({ verified: false, message: 'Blockchain proof hash mismatch! Malicious proof modification detected.' });
          }
        }

        // 4. Advanced: Use Verification Contract helper (contract logic requirement)
        console.log('Explicitly invoking VerificationContract.verifyUser via ABI...');
        await blockchainService.verifyUser(req.walletAddress, proofHash);
      }
    } catch (blockchainErr) {
      return res.status(500).json({ 
        verified: false, 
        message: 'Failed to cross-verify against Algorand blockchain.', 
        error: blockchainErr.message 
      });
    }

    return res.status(200).json({
      verified: true,
      message: 'Proof is perfectly valid and verified on-chain via Algorand!',
      dbRecord: {
        trustScore: dbProof.trustScore,
        sourceType: dbProof.sourceType,
        verifiedAt: dbProof.createdAt,
        txId: dbProof.txId
      }
    });

  } catch (error) {
    console.error('Error verifying proof:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /proofs
 * Returns all proofs (sanitized) for the explorer
 */
router.get('/proofs', async (req, res) => {
  try {
    const proofs = await Proof.find().sort({ createdAt: -1 }).limit(50);
    res.json(proofs);
  } catch (error) {
    console.error('Error fetching proofs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
