
const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), 'contracts/projects/contracts/.env') });

const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const ALGOD_PORT = 443;
const ALGOD_TOKEN = "";

const MNEMONIC = process.env.DEPLOYER_MNEMONIC;
const APPROVAL_PATH = "contracts/projects/contracts/smart_contracts/artifacts/zkp_verifier/ZkpVerifier.approval.teal";
const CLEAR_PATH = "contracts/projects/contracts/smart_contracts/artifacts/zkp_verifier/ZkpVerifier.clear.teal";

async function main() {
    if (!MNEMONIC) throw new Error("DEPLOYER_MNEMONIC not found");
    const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
    const account = algosdk.mnemonicToSecretKey(MNEMONIC);
    console.log("Deploying new app via", account.addr);

    const approval = fs.readFileSync(APPROVAL_PATH, 'utf8');
    const clear = fs.readFileSync(CLEAR_PATH, 'utf8');

    console.log("Compiling programs...");
    const approvalCompiled = await client.compile(approval).do();
    const clearCompiled = await client.compile(clear).do();

    const suggest = await client.getTransactionParams().do();
    
    const createTxn = algosdk.makeApplicationCreateTxnFromObject({
        sender: account.addr,
        approvalProgram: new Uint8Array(Buffer.from(approvalCompiled.result, 'base64')),
        clearProgram: new Uint8Array(Buffer.from(clearCompiled.result, 'base64')),
        numGlobalInts: 5,
        numGlobalByteSlices: 2,
        numLocalInts: 0,
        numLocalByteSlices: 0,
        suggestedParams: suggest,
        onComplete: algosdk.OnApplicationComplete.NoOpOC
    });

    console.log("Sending create transaction...");
    const signed = createTxn.signTxn(account.sk);
    const { txid } = await client.sendRawTransaction(signed).do();
    console.log("Success! Create TxID:", txid);
    
    // Wait for confirmation to get App ID
    console.log("Waiting for confirmation...");
    let result = await algosdk.waitForConfirmation(client, txid, 4);
    const appId = result['application-index'];
    console.log("New ZKP Verifier App ID:", appId);
    console.log(`Verify: https://testnet.explorer.perawallet.app/application/${appId}`);
}

main().catch(console.error);
