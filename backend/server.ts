import express from 'express';
import cors from 'cors';
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

const app = express();
app.use(cors());
app.use(express.json());

// Identity Oracle Keypair
// Distributed keys for consistent cross-contract verification
const ORACLE_SK = 'sCNdmksc3oBCGHiTP9Cmk0S5XtTUXpH/l7EL9pDn+GImOH17xQYjQNO1V/aG//12k3s4UtgYXZdBCeIH5NdOhw==';
const ORACLE_PK = 'Jjh9e8UGI0DTtVf2hv/9dpN7OFLYGF2XQQniB+TXToc=';

const oracleKeyPair = {
  publicKey: decodeBase64(ORACLE_PK),
  secretKey: decodeBase64(ORACLE_SK)
};

console.log('--- Identity Oracle Started ---');
console.log('Public Key:', encodeBase64(oracleKeyPair.publicKey));

/**
 * Public endpoint to retrieve the Oracle's Public Key.
 * Other services and smart contracts use this to verify the Oracle's signatures.
 */
app.get('/api/oracle-pubkey', (req, res) => {
  res.json({ publicKey: encodeBase64(oracleKeyPair.publicKey) });
});

/**
 * Secure endpoint to issue cryptographically signed credentials.
 * This simulates a trusted verification process (e.g., PAN/Aadhaar/Passport check).
 */
app.post('/api/issue-credential', (req, res) => {
  const { walletAddress, attributes } = req.body;
  
  if (!walletAddress || !attributes) {
    return res.status(400).json({ error: 'Missing required parameters: walletAddress and attributes' });
  }

  // Create the canonical document to sign
  // Including the walletAddress ensures the credential is bound to the requester
  const documentObj = {
    iss: 'Stealth-Identity-Oracle',
    sub: walletAddress,
    iat: Math.floor(Date.now() / 1000),
    data: attributes
  };

  const documentJson = JSON.stringify(documentObj);

  // Sign the document using Ed25519 (detached signature)
  const message = new TextEncoder().encode(documentJson);
  const signature = nacl.sign.detached(message, oracleKeyPair.secretKey);

  console.log(`Issued credential for: ${walletAddress}`);

  res.json({
    success: true,
    document: documentJson,
    signature: encodeBase64(signature),
    oraclePublicKey: encodeBase64(oracleKeyPair.publicKey),
    encoding: 'base64'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Identity Oracle active on http://localhost:${PORT}`);
  console.log(`Endpoint: POST /api/issue-credential`);
});
