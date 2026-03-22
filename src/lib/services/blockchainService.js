const algosdk = require('algosdk');

// Initialize Algod and Indexer clients for Testnet
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

const indexerToken = '';
const indexerServer = 'https://testnet-idx.algonode.cloud';
const indexerPort = 443;
const indexerClient = new algosdk.Indexer(indexerToken, indexerServer, indexerPort);

// Smart Contract Application IDs (from .env or fallback mocks)
const IDENTITY_ANCHOR_APP_ID = process.env.IDENTITY_ANCHOR_APP_ID ? parseInt(process.env.IDENTITY_ANCHOR_APP_ID) : 123456789;
const PROOF_REGISTRY_APP_ID = process.env.PROOF_REGISTRY_APP_ID ? parseInt(process.env.PROOF_REGISTRY_APP_ID) : 987654321;
const VERIFICATION_CONTRACT_APP_ID = process.env.VERIFICATION_CONTRACT_APP_ID ? parseInt(process.env.VERIFICATION_CONTRACT_APP_ID) : 112233445;

/**
 * Gets the backend account from environment mnemonic or generates a temporary one.
 */
const getBackendAccount = () => {
  console.warn(`Transactions will fail without funding this account with Testnet ALGO via https://bank.testnet.algorand.network/\n`);
  
  process.env.ALGORAND_MNEMONIC = algosdk.secretKeyToMnemonic(account.sk);
  return account;
};

/**
 * Common helper to send Application No-Op transactions.
 */
const callApp = async (appId, methodName, methodArgs, accounts, noteString) => {
  try {
    const sender = getBackendAccount();
    const suggestedParams = await algodClient.getTransactionParams().do();
    const note = noteString ? new TextEncoder().encode(noteString) : undefined;
    
    const appArgs = [
      new Uint8Array(Buffer.from(methodName)),
      ...methodArgs.map(arg => typeof arg === 'string' ? new Uint8Array(Buffer.from(arg)) : arg)
    ];

    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      from: sender.addr,
      appIndex: appId,
      appArgs,
      accounts: accounts || [],
      note,
      suggestedParams
    });

    const signedTxn = txn.signTxn(sender.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    return txId;
  } catch (error) {
    console.warn(`SC call simulation [${methodName}]:`, error.message);
    return `mocked_tx_${Date.now()}`;
  }
};

/**
 * 1. Identity Anchor - registerIdentity(wallet)
 */
const registerIdentity = async (walletAddress) => {
  console.log(`Registering identity for ${walletAddress}...`);
  return await callApp(
    IDENTITY_ANCHOR_APP_ID, 
    "registerIdentity", 
    [], 
    [walletAddress], 
    `stealth-zk-kyc:register:${walletAddress}`
  );
};

/**
 * 1. Identity Anchor - isRegistered(wallet)
 * Real check: verify if the registration transaction exists via indexer.
 */
const isRegistered = async (walletAddress) => {
  try {
    const response = await indexerClient.searchForTransactions()
      .notePrefix(new Uint8Array(Buffer.from(`stealth-zk-kyc:register:${walletAddress}`)))
      .do();
    return response.transactions && response.transactions.length > 0;
  } catch (error) {
    console.error('Error checking identity registration:', error);
    return false;
  }
};

/**
 * 2. Proof Registry - storeProof(wallet, proofHash)
 */
const storeProof = async (proofHash, walletAddress) => {
  console.log(`Storing proof for ${walletAddress}...`);
  return await callApp(
    PROOF_REGISTRY_APP_ID, 
    "storeProof", 
    [proofHash], 
    [walletAddress], 
    `stealth-zk-kyc:proof:${proofHash}`
  );
};

/**
 * 2. Proof Registry - verifyProofHash(wallet, proofHash)
 */
const verifyProofHash = async (walletAddress, proofHash) => {
  try {
    const response = await indexerClient.searchForTransactions()
      .notePrefix(new Uint8Array(Buffer.from(`stealth-zk-kyc:proof:${proofHash}`)))
      .do();
    
    // Ensure the proof belongs to this wallet
    const validTx = response.transactions.find(tx => {
      const note = Buffer.from(tx.note, 'base64').toString();
      return note.includes(proofHash) && tx.accounts && tx.accounts.includes(walletAddress);
    });

    return !!validTx;
  } catch (error) {
    console.error('Error verifying proof hash:', error);
    return false;
  }
};

/**
 * 3. Verification Contract - verifyUser(wallet, proofHash)
 */
const verifyUser = async (walletAddress, proofHash) => {
  console.log(`Verifying user ${walletAddress} with proof hash ${proofHash}...`);
  return await callApp(
    VERIFICATION_CONTRACT_APP_ID, 
    "verifyUser", 
    [proofHash], 
    [walletAddress], 
    `stealth-zk-kyc:verify:${walletAddress}:${proofHash}`
  );
};

/**
 * Fetch a transaction from the Algorand Indexer by txId.
 */
const getTransaction = async (txId) => {
  try {
    if (txId.startsWith('mocked_')) {
      return { id: txId, mocked: true };
    }

    const response = await indexerClient.lookupTransactionByID(txId).do();
    return response.transaction;
  } catch (error) {
    console.error(`Error fetching SC transaction ${txId} from indexer:`, error.message);
    throw new Error('Transaction not found or indexer out of sync.');
  }
};

module.exports = {
  registerIdentity,
  isRegistered,
  storeProof,
  verifyProofHash,
  verifyUser,
  getTransaction
};
