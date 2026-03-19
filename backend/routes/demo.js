const express = require('express');
const router = express.Router();

/**
 * GET /api/demo/samples
 * Provides sample API requests and expected responses for Hackathon judges & documentation.
 */
router.get('/samples', (req, res) => {
  res.json({
    message: "Stealth ZK-KYC Hackathon Demo - Sample API Payloads & Responses",
    walletRequirement: "All /api/kyc/* routes require an 'x-wallet-address' header.",
    endpoints: {
      health: {
        method: "GET",
        path: "/health",
        response: { status: "OK", timestamp: new Date().toISOString() }
      },
      "kyc-process-manual": {
        method: "POST",
        path: "/api/kyc/process",
        headers: { "x-wallet-address": "EXAMPLE_WALLET_ADDRESS_XYZ" },
        body: {
          pan: "ABCDE1234F",
          dob: "1990-01-01"
        },
        successResponse: {
          message: "KYC Processed successfully via MANUAL_ENTRY. Proof verified and saved on-chain.",
          proof: {
            proofContent: "proof_of_kyc_abcd1234efgh5678",
            publicSignals: {
              isAdult: true,
              isVerified: true,
              trustScore: 0.65,
              sourceType: "MANUAL_ENTRY"
            },
            timestamp: new Date().toISOString()
          },
          trustScore: 0.65,
          txId: "ALGORAND_TX_ID_XYZ123"
        }
      },
      "kyc-digilocker": {
        method: "POST",
        path: "/api/kyc/documents",
        headers: { "x-wallet-address": "EXAMPLE_WALLET_ADDRESS_XYZ" },
        body: {
          dl_token: "dl_token_xyz_987"
        },
        successResponse: {
          message: "KYC Processed successfully via DIGILOCKER. Proof verified and saved on-chain.",
          proof: {
             proofContent: "proof_of_kyc_digilockerabc123",
             publicSignals: {
               isAdult: true,
               isVerified: true,
               trustScore: 1.0,
               sourceType: "DIGILOCKER"
             },
             timestamp: new Date().toISOString()
          },
          trustScore: 1.0,
          txId: "ALGORAND_TX_ID_DEF456"
        }
      },
      "verify-proof": {
        method: "POST",
        path: "/api/kyc/verify",
        headers: { "x-wallet-address": "EXAMPLE_WALLET_ADDRESS_XYZ" },
        body: {
          proof: {
            proofContent: "proof_of_kyc_abcd1234efgh5678",
            publicSignals: {
              isAdult: true,
              isVerified: true,
              trustScore: 0.65,
              sourceType: "MANUAL_ENTRY"
            }
          }
        },
        successResponse: {
            verified: true,
            message: "Proof is perfectly valid and verified on-chain via Algorand!",
            dbRecord: {
              trustScore: 0.65,
              sourceType: "MANUAL_ENTRY",
              verifiedAt: new Date().toISOString(),
              txId: "ALGORAND_TX_ID_XYZ123"
            }
        }
      }
    }
  });
});

module.exports = router;
