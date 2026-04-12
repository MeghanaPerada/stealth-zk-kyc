
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
const APP_ID = parseInt(process.env.NEXT_PUBLIC_ZKP_VERIFIER_APP_ID || "757733134");

const APPROVAL_PATH = "contracts/projects/contracts/smart_contracts/artifacts/zkp_verifier/ZkpVerifier.approval.teal";
const CLEAR_PATH = "contracts/projects/contracts/smart_contracts/artifacts/zkp_verifier/ZkpVerifier.clear.teal";

async function main() {
    if (!MNEMONIC) throw new Error("DEPLOYER_MNEMONIC not found");
    const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
    const account = algosdk.mnemonicToSecretKey(MNEMONIC);
    console.log("Updating app:", APP_ID, "via", account.addr);

    const approval = fs.readFileSync(APPROVAL_PATH, 'utf8');
    const clear = fs.readFileSync(CLEAR_PATH, 'utf8');

    console.log("Compiling programs...");
    const approvalCompiled = await client.compile(approval).do();
    const clearCompiled = await client.compile(clear).do();

    const suggest = await client.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer();
    const contract = new algosdk.ABIContract(JSON.parse(fs.readFileSync('contracts/projects/contracts/smart_contracts/artifacts/zkp_verifier/ZkpVerifier.arc32.json', 'utf8')).contract);
    const updateMethod = contract.getMethodByName('update');

    atc.addMethodCall({
        appID: APP_ID,
        method: updateMethod,
        methodArgs: [],
        sender: account.addr,
        signer: algosdk.makeBasicAccountTransactionSigner(account),
        suggestedParams: suggest,
        onComplete: algosdk.OnApplicationComplete.UpdateApplicationOC,
        approvalProgram: new Uint8Array(Buffer.from(approvalCompiled.result, 'base64')),
        clearProgram: new Uint8Array(Buffer.from(clearCompiled.result, 'base64')),
    });

    console.log("Sending ABI update transaction...");
    const result = await atc.execute(client, 4);
    console.log("Success! Update TxID:", result.txIDs[0]);
    console.log(`Verify: https://testnet.explorer.perawallet.app/tx/${result.txIDs[0]}`);
}

main().catch(console.error);
