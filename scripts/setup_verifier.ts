
import algosdk from 'algosdk';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from project root and contract dir
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), 'contracts/projects/contracts/.env') });

const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const ALGOD_PORT = 443;
const ALGOD_TOKEN = "";

const MNEMONIC = process.env.DEPLOYER_MNEMONIC;
const VERIFIER_APP_ID = 757722017;
const REGISTRY_APP_ID = 757694457;
const ORACLE_PUBKEY = process.env.NEXT_PUBLIC_ORACLE_PUBKEY || "b2e96f13bbd31e7b3d18b45b5030da002ac1c3a32eda3a261fdcb107a644001f";

// Default empty root for 10 levels
const EMPTY_ROOT_HEX = "1b7201da72494f1e28717ad1a52eb469f95892f957713533de6175e5da190af2";

async function main() {
    if (!MNEMONIC) throw new Error("DEPLOYER_MNEMONIC not found");
    
    const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
    const account = algosdk.mnemonicToSecretKey(MNEMONIC);
    console.log("Using account:", account.addr);

    const suggest = await client.getTransactionParams().do();

    // 1. setMinConsensus(1)
    const setMinTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: account.addr,
        appIndex: VERIFIER_APP_ID,
        appArgs: [
            algosdk.getMethodByName([
                { name: "setMinConsensus", args: [{ type: "uint64" }], returns: { type: "void" } }
            ], "setMinConsensus").getSelector(),
            algosdk.encodeUint64(1)
        ],
        suggestedParams: suggest
    });

    // 2. setRegistryAppId(REGISTRY_APP_ID)
    const setRegTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: account.addr,
        appIndex: VERIFIER_APP_ID,
        appArgs: [
            algosdk.getMethodByName([
                { name: "setRegistryAppId", args: [{ type: "uint64" }], returns: { type: "void" } }
            ], "setRegistryAppId").getSelector(),
            algosdk.encodeUint64(REGISTRY_APP_ID)
        ],
        suggestedParams: suggest
    });

    // 3. updateMerkleRoot(EMPTY_ROOT)
    const setRootTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: account.addr,
        appIndex: VERIFIER_APP_ID,
        appArgs: [
            algosdk.getMethodByName([
                { name: "updateMerkleRoot", args: [{ type: "byte[]" }], returns: { type: "void" } }
            ], "updateMerkleRoot").getSelector(),
            // ABI byte[] encoding: 2-byte length + bytes
            algosdk.encodeAddress("Dummy").length === 32 ? Buffer.from(EMPTY_ROOT_HEX, "hex") : Buffer.concat([Buffer.from([0, 32]), Buffer.from(EMPTY_ROOT_HEX, "hex")])
        ],
        suggestedParams: suggest
    });
    
    // Correct way to encode byte[] for ARC-4: 2 bytes length prefix
    const rootArg = Buffer.concat([Buffer.from([0, 32]), Buffer.from(EMPTY_ROOT_HEX, "hex")]);
    setRootTxn.appArgs[1] = rootArg;

    // 4. addOracle(ORACLE_PUBKEY) - ensure correctly authorized with BOXES
    const addOracleTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: account.addr,
        appIndex: VERIFIER_APP_ID,
        appArgs: [
            algosdk.getMethodByName([
                { name: "addOracle", args: [{ type: "byte[]" }], returns: { type: "void" } }
            ], "addOracle").getSelector(),
            Buffer.concat([Buffer.from([0, 32]), Buffer.from(ORACLE_PUBKEY, "hex")])
        ],
        boxes: [
            { appId: VERIFIER_APP_ID, name: Buffer.concat([Buffer.from("ao"), Buffer.from(ORACLE_PUBKEY, "hex")]) }
        ],
        suggestedParams: suggest
    });

    console.log("Sending initialization group...");
    const signed = [setMinTxn, setRegTxn, setRootTxn, addOracleTxn].map(t => t.signTxn(account.sk));
    const { txId } = await client.sendRawTransaction(signed).do();
    console.log("Success! Group TxID:", txId);
    console.log(`Verify: https://testnet.explorer.perawallet.app/tx/${txId}`);
}

main().catch(console.error);
