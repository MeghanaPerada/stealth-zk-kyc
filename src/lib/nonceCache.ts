// src/lib/nonceCache.ts
// In-memory cache to prevent signature replay attacks during wallet authentication.

interface NonceRecord {
  address: string;
  expiresAt: number;
}

const nonceStore = new Map<string, NonceRecord>();

export function storeNonce(challenge: string, address: string, ttlMs: number = 60 * 1000) {
  nonceStore.set(challenge, { address, expiresAt: Date.now() + ttlMs });
}

export function consumeNonce(challenge: string, address: string): boolean {
  const record = nonceStore.get(challenge);
  
  // 1. Nonce doesn't exist (already consumed or never existed)
  if (!record) return false;
  
  // 2. Validate address match and expiry
  if (record.address !== address || record.expiresAt < Date.now()) {
    nonceStore.delete(challenge);
    return false;
  }
  
  // 3. Valid => consume it immediately to prevent replay
  nonceStore.delete(challenge);
  return true;
}
