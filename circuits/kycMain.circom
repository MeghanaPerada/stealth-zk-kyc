pragma circom 2.0.0;

include "identityHash.circom";
include "ageProof.circom";
include "panValidation.circom";
include "issuerCheck.circom";
include "merkleTree.circom";

template KYCMain() {
    // 1. Inputs
    signal input dob;             // Number format (e.g., 20030815)
    signal input birthYear;       // 2003
    signal input currentYear;     // 2026
    signal input minAge;          // 18
    signal input aadhaar_last4;   // 1234
    signal input pan[10];         // PAN chars in ASCII
    signal input issuer;          // 1 for UIDAI
    signal input public_identity_hash;
    signal input proofIdentifier; // Bound to wallet/type/status
    signal input timestamp;       // Freshness
    signal input userSecret;      // Private secret for nullifier
    signal input merkle_path_elements[10]; // Merkle tree siblings (depth 10)
    signal input merkle_path_indices[10];  // 0 for left, 1 for right

    // 2. Components
    component ageCheck = AgeProof();
    ageCheck.birthYear <== birthYear;
    ageCheck.currentYear <== currentYear;
    ageCheck.minAge <== minAge;

    component identity = IdentityHash();
    identity.dob <== dob;
    identity.aadhaar_last4 <== aadhaar_last4;
    identity.pan <== pan;
    identity.issuer <== issuer;

    component panCheck = PANValidation();
    panCheck.pan <== pan;

    // Nullifier generation (Poseidon(UserSecret, IdentityAnchor))
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== userSecret;
    nullifierHasher.inputs[1] <== public_identity_hash;

    // Merkle Tree Inclusion Proof
    component merkleTree = MerkleTreeInclusionProof(10);
    merkleTree.leaf <== identity.hash;
    for (var i = 0; i < 10; i++) {
        merkleTree.pathElements[i] <== merkle_path_elements[i];
        merkleTree.pathIndices[i] <== merkle_path_indices[i];
    }

    // 3. Assertions
    // Identity hash must match public identity hash (anchor)
    identity.hash === public_identity_hash;
    
    // PAN must be valid structure
    panCheck.isValid === 1;

    // 4. Output (Public Signals)
    signal output isVerified;
    isVerified <== ageCheck.isAdult;

    signal output nullifier;
    nullifier <== nullifierHasher.out;

    signal output merkle_root;
    merkle_root <== merkleTree.root;
}

component main = KYCMain();
