
const algosdk = require('algosdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), 'contracts/projects/contracts/.env') });

const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const ALGOD_PORT = 443;
const ALGOD_TOKEN = "";

const MNEMONIC = process.env.DEPLOYER_MNEMONIC;
const APP_ID = 757733134;

async function main() {
    if (!MNEMONIC) throw new Error("DEPLOYER_MNEMONIC not found");
    const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
    const account = algosdk.mnemonicToSecretKey(MNEMONIC);
    
    // Use BigInt for App ID in v3
    const appAddress = algosdk.getApplicationAddress(BigInt(APP_ID));
    console.log("Funding App Address:", appAddress);

    const suggest = await client.getTransactionParams().do();
    const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: account.addr,
        receiver: appAddress,
        amount: 500000, // 0.5 ALGO
        suggestedParams: suggest
    });

    console.log("Sending funding transaction...");
    const signed = payTxn.signTxn(account.sk);
    const { txId } = await client.sendRawTransaction(signed).do();
    console.log("Success! Funding TxID:", txId);
}

main().catch(console.error);
