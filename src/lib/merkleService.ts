import crypto from 'crypto';
import { buildPoseidon } from 'circomlibjs';

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
