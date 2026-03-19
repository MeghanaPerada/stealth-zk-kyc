# ZK Circuit Compilation Guide for Stealth-ZK-KYC

To use the **Real ZK Proof** generation, you must compile the Circom circuits in the `circuits/` folder and place the results in this `public/zk/` directory.

### Prerequisites
- Install Circom: https://docs.circom.io/getting-started/installation/
- SnarkJS: `npm install -g snarkjs`

### Step 1: Compile the Circuit
Run this from the project root:
```bash
circom circuits/kycMain.circom --wasm --r1cs -o zk/
```
This will generate `zk/kycMain_js/kycMain.wasm`. **Move this file directly to `zk/kycMain.wasm`**.

### Step 2: Generate ZKEY (Groth16)
You will need a Power of Tau file (e.g., `pot12_final.ptau`).

```bash
snarkjs groth16 setup zk/kycMain.r1cs zk/pot12_final.ptau zk/kyc.zkey
```

### Step 3: Export Verification Key
```bash
snarkjs zkey export verificationkey zk/kyc.zkey zk/verification_key.json
```

### Final File Requirements in `/zk`:
- `kycMain.wasm`
- `kyc.zkey`
- `verification_key.json`

Once these files are present, the `/api/zk/generate` and `/api/zk/verify` routes will work with **REAL mathematical proofs**.
