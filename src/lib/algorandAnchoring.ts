/**
 * algorandAnchoring.ts
 *
 * STATELESS ON-CHAIN ANCHORING:
 * Anchors a cryptographic commitment hash to the Algorand blockchain via a
 * simple payment transaction with the commitment stored in the note field.
 *
 * Why this approach:
 * - No smart contract calls → no opcode budget issues
 * - No backend state storage → stateless and privacy-preserving
 * - Commitment is publicly verifiable → anyone can confirm the hash
 * - User signs with their own wallet → self-sovereign identity anchoring
 * - The note field contains ONLY the commitment hash — no personal data ever
 *
 * On-chain record structure:
 *   note = "stealth-zk-kyc:commitment:<commitment_hex>"
 *
 * This can be verified by anyone with the commitment hash by searching the
 * Algorand indexer for transactions from the wallet with this note prefix.
 */

import algosdk from "algosdk";

const ALGOD_SERVER =
  process.env.NEXT_PUBLIC_ALGOD_SERVER || "https://testnet-api.algonode.cloud";
const ALGOD_PORT = process.env.NEXT_PUBLIC_ALGOD_PORT || "443";
const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";

// ─── Note Field Format ────────────────────────────────────────────────────────

const NOTE_PREFIX = "stealth-zk-kyc:commitment:";

/**
 * buildNoteField
 * Encodes the commitment into a note field byte array.
 * Max note size in Algorand is 1000 bytes. A 64-char hex commitment + prefix = ~80 chars.
 */
export function buildNoteField(commitment: string): Uint8Array {
  const noteStr = `${NOTE_PREFIX}${commitment}`;
  return new TextEncoder().encode(noteStr);
}

/**
 * parseNoteField
 * Extracts the commitment from a note field if it matches the prefix.
 */
export function parseNoteField(noteBytes: Uint8Array): string | null {
  try {
    const noteStr = new TextDecoder().decode(noteBytes);
    if (noteStr.startsWith(NOTE_PREFIX)) {
      return noteStr.slice(NOTE_PREFIX.length);
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Main Anchoring Function ──────────────────────────────────────────────────

export interface AnchorResult {
  txId: string;
  commitment: string;
  explorerUrl: string;
}

/**
 * anchorCommitment
 *
 * Anchors a ZK proof commitment to Algorand by sending a 0-ALGO payment
 * from the user's wallet to themselves, with the commitment in the note field.
 *
 * @param commitment       - The SHA-256 commitment hex string (64 chars)
 * @param walletAddress    - The user's Algorand wallet address (sender + receiver)
 * @param signTransactions - Wallet signing function from useWallet hook
 * @returns                - { txId, commitment, explorerUrl }
 */
export async function anchorCommitment(
  commitment: string,
  walletAddress: string,
  signTransactions: (txns: Uint8Array[], indexes?: number[]) => Promise<(Uint8Array | null)[]>
): Promise<AnchorResult> {
  // Build algod client (read-only, no secrets)
  const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

  // Fetch suggested transaction params from Algorand Testnet
  const suggestedParams = await algodClient.getTransactionParams().do();

  // Build a 0-ALGO self-payment with the commitment in the note field
  // This is the minimal footprint anchoring: costs only the minimum fee (~0.001 ALGO)
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: walletAddress,
    receiver: walletAddress,      // Self-payment — no ALGO transferred
    amount: 0,                    // Zero value — only paying the tx fee
    note: buildNoteField(commitment),
    suggestedParams: {
      ...suggestedParams,
      fee: Math.max(Number(suggestedParams.minFee ?? 1000), 1000),
      flatFee: true,
    },
  });

  // Sign with user's wallet — this is the user's cryptographic attestation
  const encodedTxn = txn.toByte();
  const signedTxns = await signTransactions([encodedTxn]);
  const signedTxn = signedTxns[0];

  if (!signedTxn) {
    throw new Error("Transaction signing was rejected or failed.");
  }

  // Submit to the Algorand Testnet
  const response = await algodClient.sendRawTransaction(signedTxn).do();

  // Derive txID from the signed transaction bytes (algosdk v3 compatible)
  const txId = algosdk.decodeSignedTransaction(signedTxn).txn.txID();

  // Wait for confirmation (up to 5 rounds)
  await algosdk.waitForConfirmation(algodClient, txId, 5);

  const explorerUrl = `https://testnet.explorer.perawallet.app/tx/${txId}`;

  return { txId, commitment, explorerUrl };
}

/**
 * lookupAnchoredCommitment
 *
 * Looks up the Algorand indexer to find if a given wallet has anchored a specific commitment.
 * Used by the Verify page to cross-reference a commitment against on-chain data.
 *
 * @param walletAddress - The wallet to search
 * @param commitment    - The commitment hex to look for
 */
export async function lookupAnchoredCommitment(
  walletAddress: string,
  commitment: string
): Promise<string | null> {
  try {
    const indexerServer =
      process.env.NEXT_PUBLIC_INDEXER_SERVER || "https://testnet-idx.algonode.cloud";

    const res = await fetch(
      `${indexerServer}/v2/accounts/${walletAddress}/transactions?note-prefix=${btoa(NOTE_PREFIX)}&limit=20`
    );
    if (!res.ok) return null;
    const data = await res.json();

    for (const txn of data.transactions || []) {
      const noteB64 = txn.note;
      if (!noteB64) continue;
      const noteBytes = Uint8Array.from(atob(noteB64), (c) => c.charCodeAt(0));
      const extracted = parseNoteField(noteBytes);
      if (extracted === commitment) {
        return txn.id;
      }
    }
    return null;
  } catch {
    return null;
  }
}
