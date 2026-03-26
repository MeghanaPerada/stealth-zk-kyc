
const algosdk = require('algosdk');
const dotenv = require('dotenv');
const path = require('path');

// Load env from project root and contract dir
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), 'contracts/projects/contracts/.env') });

const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const ALGOD_PORT = 443;
const ALGOD_TOKEN = "";

const MNEMONIC = process.env.DEPLOYER_MNEMONIC;
const VERIFIER_APP_ID = 757733134;
const REGISTRY_APP_ID = 757694457;
const ORACLE_PUBKEY = process.env.NEXT_PUBLIC_ORACLE_PUBKEY || "b2e96f13bbd31e7b3d18b45b5030da002ac1c3a32eda3a261fdcb107a644001f";

const EMPTY_ROOT_HEX = "1b7201da72494f1e28717ad1a52eb469f95892f957713533de6175e5da190af2";

async function main() {
    if (!MNEMONIC) throw new Error("DEPLOYER_MNEMONIC not found");
    
    const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
    const account = algosdk.mnemonicToSecretKey(MNEMONIC);
    console.log("Using account:", account.addr);

    const suggest = await client.getTransactionParams().do();

    // Helper to get method selector
    const getSelector = (sigObj) => {
        return new algosdk.ABIMethod(sigObj).getSelector();
    };

    // 1. setMinConsensus(1)
    const setMinTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account.addr,
        appIndex: VERIFIER_APP_ID,
        appArgs: [
            getSelector({ name: "setMinConsensus", args: [{ type: "uint64" }], returns: { type: "void" } }),
            algosdk.encodeUint64(1)
        ],
        suggestedParams: suggest
    });

    // 2. setRegistryAppId(REGISTRY_APP_ID)
    const setRegTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account.addr,
        appIndex: VERIFIER_APP_ID,
        appArgs: [
            getSelector({ name: "setRegistryAppId", args: [{ type: "uint64" }], returns: { type: "void" } }),
            algosdk.encodeUint64(REGISTRY_APP_ID)
        ],
        suggestedParams: suggest
    });

    // 3. updateMerkleRoot(EMPTY_ROOT)
    const setRootTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account.addr,
        appIndex: VERIFIER_APP_ID,
        appArgs: [
            getSelector({ name: "updateMerkleRoot", args: [{ type: "byte[]" }], returns: { type: "void" } }),
            Buffer.concat([Buffer.from([0, 32]), Buffer.from(EMPTY_ROOT_HEX, "hex")])
        ],
        suggestedParams: suggest
    });

    // 4. addOracle(ORACLE_PUBKEY)
    const addOracleTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account.addr,
        appIndex: VERIFIER_APP_ID,
        appArgs: [
            getSelector({ name: "addOracle", args: [{ type: "byte[]" }], returns: { type: "void" } }),
            Buffer.concat([Buffer.from([0, 32]), Buffer.from(ORACLE_PUBKEY, "hex")])
        ],
        boxes: [
            { appIndex: VERIFIER_APP_ID, name: Buffer.concat([Buffer.from("ao"), Buffer.from(ORACLE_PUBKEY, "hex")]) }
        ],
        suggestedParams: suggest
    });

    console.log("Sending initialization group...");
    const txns = [setMinTxn, setRegTxn, setRootTxn, addOracleTxn];
    algosdk.assignGroupID(txns);
    const signed = txns.map(t => t.signTxn(account.sk));
    const { txId } = await client.sendRawTransaction(signed).do();
    console.log("Success! Group TxID:", txId);
    console.log(`Verify: https://testnet.explorer.perawallet.app/tx/${txId}`);
}

main().catch(console.error);
