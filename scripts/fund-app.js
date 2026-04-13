const algosdk = require('algosdk');

const oracleKey = "db44fc904a6f941b5264c95b8365e5c8b906ef2743d77d48d36d27d60a079034b2e96f13bbd31e7b3d18b45b5030da002ac1c3a32eda3a261fdcb107a644001f";
const keyBytes = Buffer.from(oracleKey, 'hex');
// In Algorand, a secret key is 64 bytes (32-byte seed + 32-byte public key)
const senderAddress = algosdk.encodeAddress(keyBytes.slice(32));

const client = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
const appAddressObj = algosdk.getApplicationAddress(757733134);
const appAddress = appAddressObj.toString();
console.log("App Address:", appAddress);
console.log("Sender Address:", senderAddress);

async function fundApp() {
  const suggestedParams = await client.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: senderAddress,
    receiver: appAddress,
    amount: 200000, 
    suggestedParams
  });

  const signedTxn = txn.signTxn(keyBytes); 
  console.log("Sending funding transaction...");
  const txInfo = await client.sendRawTransaction(signedTxn).do();
  console.log("Sent with txId:", txInfo.txId);
  await algosdk.waitForConfirmation(client, txInfo.txId, 4);
  console.log("App successfully funded with 0.5 ALGO!");
}

fundApp().catch(console.error);
