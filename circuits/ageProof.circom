pragma circom 2.0.0;
include "node_modules/circomlib/circuits/comparators.circom";

template AgeProof() {
    signal input birthYear;
    signal input currentYear;
    signal input minAge;
    signal output isAdult;

    signal diff;
    diff <== currentYear - birthYear;

    component gte = GreaterEqThan(32);
    gte.in[0] <== diff;
    gte.in[1] <== minAge;

    isAdult <== gte.out;
}
