# Stealth ZK-KYC 🛡️
> **A Stateless, 100% On-Chain Privacy-Preserving Identity Protocol for the Algorand Ecosystem.**

Stealth ZK-KYC redefines decentralized identity by eliminating "Identity Honeypots." Traditional KYC systems require users to upload sensitive PII to centralized servers. Stealth ZK-KYC replaces this liability with **mathematical certainty** and **cryptographic privacy**.

---

## 🏆 The "Stateless Trust" Architecture
The core philosophy of Stealth ZK-KYC is to move identity management from centralized databases to the **Algorand Blockchain**, while maintaining absolute user privacy through **Zero-Knowledge Proofs (ZKP)**.

- **Zero Data Retained**: Personal Identifiable Information (PII) is processed entirely client-side. The backend never sees, stores, or handles unencrypted user data.
- **On-Chain Verifiability**: Groth16 pairing checks are performed directly on-chain using the **AVM 11 pairing opcodes**, ensuring that only valid, oracle-signed identities are anchored.
- **Privacy at Scale**: Users generate reusable proofs locally. Once an identity is anchored, users can prove specific attributes (e.g., age > 18) without revealing their underlying wallet address or real-world identity to the service provider.

---

## 🚀 Key Protocol Features

### 1. **Premium Gated Access & Rewards** 💎
Experience the first ZK-gated economy on Algorand. Successful ZK verification grants access to high-tier "Premium Portals" and enables the claiming of gated rewards, demonstrating real-world utility for privacy-preserving credentials.

### 2. **Universal Proof Explorer** 🔍
A dedicated dashboard to view anchored proof hashes and verification logs. Filter by wallet address to manage your own privacy footprint while viewing the global health of the protocol.

### 3. **Anonymous Nullifiers & Sybil Resistance** 🛡️
Prevents "One-Person-Many-Wallets" attacks. The protocol uses unique nullifiers derived from the identity hash, preventing double-claiming while ensuring that the primary identity remains 100% anonymous.

### 4. **Multi-Step Live ZK Terminal** 🖥️
Witness the cryptography in real-time. Our frontend provides a real-time console showing the exact steps of witness generation, proof computation, and on-chain submission.

---

## 🛠️ Technical Stack
Stealth ZK-KYC is built with the most advanced tools in the Algorand and ZK ecosystems:

- **Frontend Architecture**: [Next.js 15](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/).
- **Animations & UX**: [Framer Motion](https://www.framer.com/motion/) for smooth transitions, [Lucide React](https://lucide.dev/) for iconography.
- **Smart Contracts**: [Algorand TypeScript (PuyaTS)](https://github.com/algorandfoundation/puya-ts).
- **ZK Engine**: [Circom 2.1+](https://iden3.io/circom), [SnarkJS](https://github.com/iden3/snarkjs) for Groth16 proofs, [Poseidon Hashing](https://www.poseidon-hash.info/).
- **Blockchain Interface**: [AlgoKit Utils TS](https://github.com/algorandfoundation/algokit-utils-ts), [AVM 11](https://developer.algorand.org/) via Algorand Localnet.

---

## 📂 Project Structure
```text
├── circuits/           # Circom identity & attribute-check circuits
├── contracts/          # Algorand PuyaTS Smart Contracts (ZkpVerifier, Registry)
├── public/zk/          # Pre-compiled .wasm and .zkey artifacts for Groth16
├── src/
│   ├── app/            # Feature pages: /kyc, /explorer, /premium, /simulate
│   ├── components/     # Specialized ZK components (LiveTerminal, PageWrapper)
│   ├── lib/            # Crypto utilities, circuit helpers, and on-chain logic
│   └── hooks/          # Custom Wallet and ZK lifecycle hooks
└── tests/              # End-to-end integration and smart contract tests
```

---

## 🏁 Getting Started

### Prerequisites
- [AlgoKit](https://github.com/algorandfoundation/algokit-cli) (Required for Localnet & contract compilation)
- [Node.js v20+](https://nodejs.org/)
- [Docker](https://www.docker.com/) (For Algorand Localnet)

### Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/MeghanaPerada/stealth-zk-kyc.git
   cd stealth-zk-kyc
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Algorand Localnet**:
   ```bash
   algokit localnet start
   ```

4. **Compile Smart Contracts**:
   ```bash
   cd contracts/projects/contracts && npm run build
   ```

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to interact with the protocol.

---

## 🛡️ Security & Privacy First
- **Environment Management**: Never commit your `.env` to GitHub. Use `.env.example` to set up your local environment.
- **Mnemonic Safety**: Use disposable accounts for Localnet/TestNet. Never use MainNet accounts for development.

---
**Stealth ZK-KYC: Built to protect, verified to trust.**
