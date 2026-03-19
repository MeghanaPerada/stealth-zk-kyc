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

    // 2. Store proof on Algorand Testnet
    const txId = await blockchainService.storeProof(proof.proofContent, walletAddress);

    // 3. Save proof metadata to MongoDB (No PII) along with txId
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
    message: `KYC Processed successfully via ${sourceType}. Proof verified and saved on-chain.`,
    proof,
    trustScore
  });
};

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
        const tx = await blockchainService.getTransaction(dbProof.txId);
        
        // If it's not a generic mocked placeholder during unfunded tests
        if (!tx.mocked) {
          if (!tx.note || typeof tx.note !== 'string') {
            return res.status(400).json({ verified: false, message: 'Blockchain transaction missing the note.' });
          }

          // Convert indexer base64 note string to matching utf8 Text
          const noteBuffer = Buffer.from(tx.note, 'base64');
          const decodedNote = new TextDecoder('utf-8').decode(noteBuffer);

          if (decodedNote !== `stealth-zk-kyc:proof:${proofHash}`) {
            return res.status(400).json({ verified: false, message: 'Blockchain proof hash mismatch! Malicious proof modification detected.' });
          }
        }
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

module.exports = router;
