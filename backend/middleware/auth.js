/**
 * Middleware to ensure the request is accompanied by a wallet address header.
 * No wallet -> No KYC.
 */
const requireWallet = (req, res, next) => {
  const walletAddress = req.headers['x-wallet-address'];

  if (!walletAddress) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Wallet connection is mandatory. Missing x-wallet-address header.'
    });
  }

  // You can optionally validate the Algorand address format here
  
  // Attach the wallet address to the request context
  req.walletAddress = walletAddress;
  next();
};

module.exports = { requireWallet };
