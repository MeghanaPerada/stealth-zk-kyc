# 🥷 Stealth ZK-KYC

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Algorand](https://img.shields.io/badge/Algorand-000000?style=for-the-badge&logo=algorand&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

**Stealth ZK-KYC** is a privacy-preserving identity verification protocol built on the Algorand blockchain. It enables users to verify their identity or attributes (like "Age Over 18") using Zero-Knowledge Proofs (ZKPs) without ever exposing their sensitive personal data to third parties.

---

## 🌟 Key Features

- **🔐 Privacy-First Architecture**: Sensitive PII stays in your browser. Only cryptographic proofs are shared.
- **👛 Pera Wallet Integration**: Secure identity anchoring using industry-standard Algorand wallets.
- **⚡ Local ZKP Generation**: Proofs are computed locally on the client-side using a terminal-style prover interface.
- **⛓️ Immutable Proof Anchoring**: Proof metadata is anchored on Algorand Testnet for public, tamper-proof verifiability.
- **📡 Real-Time Verification**: Organizations can verify proofs instantly by querying the blockchain directly.
- **✨ Premium UI/UX**: Futuristic dark-themed aesthetic with glassmorphism and smooth micro-animations.

---

## 🏗️ The 5-Step Identity Flow

The system follows a decentralized identity lifecycle:

1.  **Connect Wallet**: Bind your decentralized identity as the ownership anchor.
2.  **Acquire Credentials**: Fetch cryptographically signed data from an Identity Oracle or upload your own.
3.  **Generate ZKP**: Compute a mathematical proof that you meet specific criteria without revealing raw data.
4.  **Anchor to Algorand**: Store the proof hash immutably in a transaction note on the Testnet.
5.  **Public Verification**: Provide your Proof ID to any organization for instant, math-backed validation.

---

## 🛠️ Technical Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Blockchain**: [Algorand Testnet](https://algorand.co/) (algosdk)
- **Wallet**: [@txnlab/use-wallet-react](https://github.com/TxnLab/use-wallet) (Pera, Defly, Lute)
- **Styling**: Tailwind CSS & Vanilla CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Pera Wallet](https://perawallet.app/) or any supported Algorand wallet correctly configured for **Testnet**.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MeghanaPerada/stealth-zk-kyc.git
   cd stealth-zk-kyc
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Security

Stealth ZK-KYC prioritizes user data sovereignty. 
- **No Database**: We do not store any user data on servers.
- **Math-Based**: Trust is established through cryptography, not human intermediaries.
- **Transparent**: Every proof is anchored to a public blockchain for auditability.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Developed with ❤️ for the decentralized future.
