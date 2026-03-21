pragma circom 2.0.0;

include "circomlib/poseidon.circom";
include "circomlib/comparators.circom";

template KYC() {
    // 🔐 Private Inputs
    signal input dob;             // YYYYMMDD as number
    signal input aadhaar_last4;   // 4 digits
    signal input pan_hash;        // numeric hash of PAN
    signal input wallet;          // Numeric representation of wallet address
    signal input consent_hash;    // Poseidon hash of consent data

    // 🌐 Public Inputs
    signal input expected_identity_hash;
    signal input expected_consent_hash;

    // 🔥 Poseidon Hash (Identity Binding)
    // Computes Poseidon(dob, aadhaar_last4, pan_hash, wallet)
    component poseidon = Poseidon(4);
    poseidon.inputs[0] <== dob;
    poseidon.inputs[1] <== aadhaar_last4;
    poseidon.inputs[2] <== pan_hash;
    poseidon.inputs[3] <== wallet;

    // ✅ Constraint 1: Identity must match public anchor
    poseidon.out === expected_identity_hash;

    // ✅ Constraint 2: Consent must match public anchor
    consent_hash === expected_consent_hash;

    // 🔥 Constraint 3: Adult check (Age >= 18)
    // Circuit checks if dob < 20060101
    component lt = LessThan(32);
    lt.in[0] <== dob;
    lt.in[1] <== 20060101;
    
    // Output 1 if Adult, 0 if not
    signal output isVerified;
    isVerified <== lt.out;
    
    // Identity hash also released as output for verifier convenience
    signal output identityHashOutput;
    identityHashOutput <== poseidon.out;
}

component main = KYC();
