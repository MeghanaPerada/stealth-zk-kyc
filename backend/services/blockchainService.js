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

/**
 * Gets the backend account from environment mnemonic or generates a temporary one.
 */
const getBackendAccount = () => {
  if (process.env.ALGORAND_MNEMONIC) {
    try {
      return algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    } catch (e) {
      console.error('Invalid ALGORAND_MNEMONIC in environment.');
    }
  }
  const account = algosdk.generateAccount();
  console.warn(`\n[WARNING] No valid ALGORAND_MNEMONIC provided.`);
  console.warn(`Generated ephemeral account: ${account.addr}`);
  console.warn(`Transactions will fail without funding this account with Testnet ALGO via https://bank.testnet.algorand.network/\n`);
  
  process.env.ALGORAND_MNEMONIC = algosdk.secretKeyToMnemonic(account.sk);
  return account;
};

/**
 * Store proof hash on Algorand Testnet.
 * Dispatches an ApplicationCall over our lightweight ProofRegistry smart contract, 
 * utilizing the Note field for robust minimal primary storage.
 */
const storeProof = async (proofHash, walletAddress) => {
  try {
    const sender = getBackendAccount();
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Main storage structure: the transaction note
    const noteString = `stealth-zk-kyc:proof:${proofHash}`;
    const note = new TextEncoder().encode(noteString);

    // Call ProofRegistry.storeProof(wallet, proofHash) via ABI approximation
    const appArgs = [
      new Uint8Array(Buffer.from("storeProof")), 
      new Uint8Array(Buffer.from(proofHash))
    ];
    
    const accounts = [walletAddress]; 

    // Submit as smart contract Application Call
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      from: sender.addr,
      appIndex: PROOF_REGISTRY_APP_ID,
      appArgs,
      accounts,
      note,
      suggestedParams
    });

    const signedTxn = txn.signTxn(sender.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    console.log(`Broadcasting AppCall ${txId}... awaiting confirmation...`);
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    console.log(`Proof explicitly anchored into Smart Contract! TxId: ${txId}`);
    return txId;
  } catch (error) {
    console.error('Error executing Algorand AppCall:', error);
    
    if (error.message.includes('overspend') || error.message.includes('below min') || error.message.includes('does not exist') || error.message.includes('application does not exist')) {
      console.warn('Simulating smart contract execution because environment is fully mock/unfunded...');
      return `mocked_sc_tx_${Date.now()}`;
    }

    throw new Error(`Failed to execute smart contract transaction: ${error.message}`);
  }
};

/**
 * Fetch a transaction from the Algorand Indexer by txId.
 */
const getTransaction = async (txId) => {
  try {
    if (txId.startsWith('mocked_sc_tx_')) {
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
  storeProof,
  getTransaction
};
