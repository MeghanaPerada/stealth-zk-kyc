import crypto from 'crypto';
import { buildPoseidon } from 'circomlibjs';
import fs from 'fs';
import path from 'path';
import algosdk from 'algosdk';

const MERKLE_FILE = path.join(process.cwd(), 'merkle_tree.json');

/**
 * A lightweight, in-memory Poseidon-based Merkle Tree implementation
 * tailored for Stealth ZK-KYC.
 * 
 * In a production scenario, this would be backed by a database 
 * to persist the tree state across server restarts.
 */
export class MerkleService {
  private levels: number;
  private leaves: string[];
  private tree: string[][]; // Level-by-level cache (0 is leaves, length-1 is root)
  private defaultHashes: string[];
  private poseidon: any;

  constructor(levels: number = 10) {
    this.levels = levels;
    this.leaves = [];
    this.tree = [];
    this.defaultHashes = [];
  }

  /**
   * Initialize the Poseidon hasher and pre-compute default hashes for empty nodes.
   */
  public async init() {
    this.poseidon = await buildPoseidon();
    
    // Compute default zero hashes up the tree
    let currentZero = "0";
    this.defaultHashes.push(currentZero);
    
    for (let i = 1; i <= this.levels; i++) {
        currentZero = this.hash(currentZero, currentZero);
        this.defaultHashes.push(currentZero);
    }

    this.loadState();
  }

  private loadState() {
    try {
        if (fs.existsSync(MERKLE_FILE)) {
            const data = fs.readFileSync(MERKLE_FILE, 'utf-8');
            const state = JSON.parse(data);
            if (state && Array.isArray(state.leaves)) {
                this.leaves = state.leaves;
                this.rebuildTree();
                console.log(`[MerkleService] Loaded ${this.leaves.length} leaves from storage.`);
            }
        }
    } catch (err) {
        console.error("[MerkleService] Error loading state:", err);
    }
  }

  private saveState() {
    try {
        const state = { leaves: this.leaves };
        fs.writeFileSync(MERKLE_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
        console.error("[MerkleService] Error saving state:", err);
    }
  }

  private async anchorRoot() {
      try {
          const rootStr = this.getRoot();
          // Pad the decimal string to hex (32 bytes)
          let rootHex = BigInt(rootStr).toString(16);
          rootHex = rootHex.padStart(64, '0');

          const ALGOD_SERVER = process.env.NEXT_PUBLIC_ALGOD_SERVER || "https://testnet-api.algonode.cloud";
          const ALGOD_PORT = process.env.NEXT_PUBLIC_ALGOD_PORT || 443;
          const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
          const MNEMONIC = process.env.DEPLOYER_MNEMONIC;
          const APP_ID = parseInt(process.env.NEXT_PUBLIC_ZKP_VERIFIER_APP_ID || "757733134");

          if (!MNEMONIC) {
              console.warn("[MerkleService] Skipping anchor: DEPLOYER_MNEMONIC not set.");
              return;
          }

          const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
          const account = algosdk.mnemonicToSecretKey(MNEMONIC);
          const suggest = await client.getTransactionParams().do();

          const setRootTxn = algosdk.makeApplicationNoOpTxnFromObject({
              sender: account.addr,
              appIndex: APP_ID,
              appArgs: [
                  new algosdk.ABIMethod({ name: "updateMerkleRoot", args: [{ type: "byte[]" }], returns: { type: "void" } }).getSelector(),
                  Buffer.concat([Buffer.from([0, 32]), Buffer.from(rootHex, "hex")])
              ],
              suggestedParams: suggest
          });

          const signed = setRootTxn.signTxn(account.sk);
          const response = await client.sendRawTransaction(signed).do() as any;
          console.log(`[MerkleService] Anchored new root to Testnet. TxID: ${response.txId}`);
      } catch (err) {
          console.error("[MerkleService] Failed to anchor root on chain:", err);
      }
  }

  /**
   * Hash two strings using Poseidon.
   */
  private hash(left: string, right: string): string {
    const res = this.poseidon([BigInt(left), BigInt(right)]);
    return this.poseidon.F.toObject(res).toString();
  }

  /**
   * Adds a new verified identity hash (leaf) to the tree.
   * Rebuilds the tree structure for quick proof extraction.
   */
  public addLeaf(leafStr: string) {
    if (this.leaves.includes(leafStr)) {
      return; // Already in tree
    }
    this.leaves.push(leafStr);
    this.rebuildTree();
    this.saveState();
    
    // Anchor asynchronously so it doesn't block the API response
    this.anchorRoot().catch(console.error);
  }

  /**
   * Fully rebuilds the internal tree structure from the current leaves.
   */
  private rebuildTree() {
    this.tree = [];
    let currentLevel = [...this.leaves];
    
    // Ensure power of 2 padding at the leaf level using default hash 0
    const maxLeaves = Math.pow(2, this.levels);
    while (currentLevel.length < maxLeaves) {
        currentLevel.push(this.defaultHashes[0]);
    }

    this.tree.push([...currentLevel]);

    for (let i = 0; i < this.levels; i++) {
      const nextLevel: string[] = [];
      for (let j = 0; j < currentLevel.length; j += 2) {
        const left = currentLevel[j];
        const right = currentLevel[j + 1];
        nextLevel.push(this.hash(left, right));
      }
      this.tree.push([...nextLevel]);
      currentLevel = nextLevel;
    }
  }

  /**
   * Gets the current Merkle Root (the element at the top of the tree).
   */
  public getRoot(): string {
    if (this.tree.length === 0) {
        return this.defaultHashes[this.levels];
    }
    return this.tree[this.tree.length - 1][0];
  }

  /**
   * generates a Merkle Inclusion Proof for a given leaf.
   * Returns path elements and path indices (0 for left, 1 for right).
   */
  public getProof(leafStr: string) {
    let index = this.leaves.indexOf(leafStr);
    if (index === -1) {
      throw new Error("Leaf not found in Merkle Tree");
    }

    const pathElements: string[] = [];
    const pathIndices: number[] = [];

    for (let i = 0; i < this.levels; i++) {
        const isLeft = index % 2 === 0;
        const siblingIndex = isLeft ? index + 1 : index - 1;
        
        pathElements.push(this.tree[i][siblingIndex]);
        pathIndices.push(isLeft ? 1 : 0); // 1 means sibling is on the right, 0 means sibling is left

        index = Math.floor(index / 2);
    }

    return {
      root: this.getRoot(),
      pathElements,
      pathIndices
    };
  }
}

// Singleton instance for the backend
export const merkleService = new MerkleService(10);
