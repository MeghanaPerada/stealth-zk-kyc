const express = require('express');
const router = express.Router();

/**
 * GET /digilocker
 * Mocks initiation of DigiLocker OAuth flow.
 * In a real scenario, this redirects the user to DigiLocker login page.
 */
router.get('/digilocker', (req, res) => {
  const walletAddress = req.query.walletAddress;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'walletAddress is required for DigiLocker auth' });
  }

  // Pass walletAddress as 'state' parameter to keep track of the session
  const mockDigilockerUrl = `/api/auth/callback?state=${walletAddress}&code=mock_auth_code_123`;
  
  res.json({
    message: 'Redirect to DigiLocker',
    url: mockDigilockerUrl
  });
});

/**
 * GET /callback
 * Mocks the callback from DigiLocker after user authorizes.
 */
router.get('/callback', (req, res) => {
  const { state: walletAddress, code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  res.json({
    message: 'DigiLocker Authentication Successful',
    walletAddress,
    mockAccessToken: 'dl_token_xyz_987',
    sourceType: 'DIGILOCKER'
  });
});

module.exports = router;
