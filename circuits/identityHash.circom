pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";

template IdentityHash() {
    signal input dob;
    signal input aadhaar_last4;
    signal input pan[10];
    signal input issuer;
    signal output hash;

    component poseidon = Poseidon(13); // dob + last4 + pan[10] + issuer
    poseidon.inputs[0] <== dob;
    poseidon.inputs[1] <== aadhaar_last4;
    for (var i = 0; i < 10; i++) {
        poseidon.inputs[i+2] <== pan[i];
    }
    poseidon.inputs[12] <== issuer;

    hash <== poseidon.out;
}
