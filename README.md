# Stealth ZK-KYC
**A Full-Stack Privacy-Preserving KYC System on Algorand**

## Overview
Stealth ZK-KYC represents the next generation of identity verification. We combine **Zero-Knowledge Proofs (ZK)** with the **Algorand Blockchain** to allow users to prove their eligibility (e.g., age > 18, valid nationality) without ever exposing their underlying Personally Identifiable Information (PII) such as their PAN card or Date of Birth.

## Why Stealth ZK-KYC?
Traditional KYC models force users to upload highly sensitive documents to centralized databases, creating massive honeypots for hackers. Stealth ZK-KYC reverses this model completely:
- **Wallet-First Architecture:** Identity is intrinsically tied to your non-custodial Algorand wallet address. If there is no wallet, there is no verification.
- **Zero Data Leaks:** Raw PII is evaluated locally/in-memory, converted to a zero-knowledge logical proof hash, and discarded. It is never stored.
- **Immutable Trust via Algorand:** Mathematical proofs are permanently and immutably anchored to the Algorand network.

## System Architecture

### 1. Frontend (Next.js & Tailwind CSS)
A beautiful, highly-responsive modern interface allowing users to seamlessly connect their Algorand wallets, submit identity documents, simulate high-trust DigiLocker connections, and view their active KYC proofs visually.

### 2. Backend Processing (Node.js & Express)
The engine securely coordinating the complex data flows:
- **`POST /api/kyc/documents` (DigiLocker Mocking)**: Simulates integration with government systems for verified high-trust scoring (`1.0`).
- **`POST /api/kyc/upload`**: Takes manual PDF/image uploads via Multer, parsing them for logical checks, and attributing variable trust scores (`0.6-0.8`).
- **ZK Generation**: Dynamically simulates secure proof generation, returning a rigorous metadata payload containing constraints (like `isAdult`).

### 3. Database Layer (MongoDB & Mongoose)
A NoSQL database responsible exclusively for rapid metadata indexing. We strictly enforce the segregation of PII. We securely store only:
- Algorand Wallet Addresses
- Proof Hashes
- Validation Trust Scores & Data Source Types
- Algorand Transaction IDs

### 4. Smart Contracts & Decentralized Trust (Algorand + PuyaTS)
Algorand is our ultimate source of immutability and trust cross-referencing.
- **algosdk Integrations**: The backend seamlessly submits securely derived ZK Proof hashes natively on-chain. The specific proof sits inside the transaction `note` field.
- **PuyaTS Helper Contracts**: Contains 3 tightly-coupled smart contracts explicitly written in modern Algorand TypeScript (`@algorandfoundation/algorand-typescript`):
  - `IdentityAnchor`
  - `ProofRegistry`
  - `VerificationContract`

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas (or local MongoDB context)
- An Algorand Node/Indexer (Connects to Algonode Testnet locally by default)

### Installation
1. Clone the repository.
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

### Running the Application

1. **Start the Frontend:**
   ```bash
   npm run dev
   ```
   *Available at http://localhost:3000*

2. **Start the Backend:**
   ```bash
   cd backend
   npm start
   ```
   *Available at http://localhost:3001*

### See the Demo Architecture
Want to instantly see how the API operates? Browse our auto-generated Hackathon payloads via our built-in demo route: `http://localhost:3001/api/demo/samples`

---

### The Verification Flow
1. Connect your Algorand Testnet wallet on the frontend.
2. Navigate to KYC process and upload a document or authorize DigiLocker.
3. The Node server evaluates the structural constraints and dynamically issues a ZKP.
4. The server structurally formats Algorand Application Calls to our PuyaTS components while locking the hash into the chain.
5. The Verification endpoint (`/api/kyc/verify`) utilizes **3-Layer Cross Verification**:
   - Math Proof cryptography check.
   - Metadata registry match mapping Wallet to Hash.
   - Live Testnet query structurally evaluating the `note` buffer against our Smart Contracts.

---
**Built for Web3 Hackathons. Built to Protect User Privacy.**
