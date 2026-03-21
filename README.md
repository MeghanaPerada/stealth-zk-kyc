# Stealth ZK-KYC 🛡️
**A 100% On-Chain, Privacy-Preserving Identity Protocol on Algorand**

## 🏆 The Pitch: "Stateless Trust"
Stealth ZK-KYC solves the "Identity Honeypot" problem. Traditional KYC forces users to upload sensitive documents to centralized databases. We replace this with **mathematical certainty**.
- **No Databases**: 100% of the identity state is stored in **Algorand Boxes**.
- **Privacy at Source**: ZK Proofs are generated **locally in the browser** using SnarkJS. The backend never sees your PII.
- **Stealth Privacy**: Box keys are hashed via `SHA256(Wallet + AppSecret)`, making identity status non-linkable to casual chain observers.

## 🚀 Key Features (Top 1% Build)
- **On-Chain ZK Verification**: Real Groth16 pairing checks (`AVM 11`) performed directly in the `ZkpVerifier` smart contract.
- **Anonymous Nullifiers**: Prevents Sybil attacks (one identity, many wallets) while maintaining 100% user anonymity.
- **M-of-N Oracle Consensus**: Robust security that requires multiple authorized signatures before anchoring a proof.
- **Attack Simulator (`/simulate`)**: A dedicated "Hacker Mode" to demonstrate resistance against forged proofs and double-claims.
- **Live ZK Terminal**: Real-time cryptographic logs displayed during client-side proving.

## 🛠️ Technical Stack
- **Frontend/Backend**: Next.js 15 (Full-Stack), Tailwind CSS, Framer Motion.
- **ZK Engine**: Circom 2.2.3, SnarkJS (Groth16), Poseidon Hashing.
- **Smart Contracts**: Algorand TypeScript (PuyaTS), AVM 11.
- **Blockchain Storage**: Algorand Boxes (Global & Local state).

## 📂 Project Structure
- `/contracts`: PuyaTS smart contracts (`ZkpVerifier`, `IdentityRegistry`).
- `/circuits`: Circom circuits for identity and Merkle inclusion proofs.
- `/public/zk`: Production-ready ZK artifacts (`kycMain.wasm`, `kyc.zkey`).
- `/src/components/kyc`: The End-to-End ZK-KYC journey.

## 🏁 Getting Started
1. **Clone & Install**: `npm install`
2. **Localnet**: `algokit localnet start`
3. **Build & Generate**: 
   ```bash
   cd contracts/projects/contracts && npm run build
   ```
4. **Run**: `npm run dev`

## ⚔️ Judging Demo Script
1. **The Simulator**: Go to `/simulate` and show the **Nullifier** explanation.
2. **The KYC Flow**: Go to `/kyc`, run the **Live ZK Terminal**, and generate a proof.
3. **The Anchor**: Click **"Verify on Algorand"** on the success screen to see the 100% on-chain verification in action.

---
**Built to protect user privacy. Built for the future of decentralized identity.**
