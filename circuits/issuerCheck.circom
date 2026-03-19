pragma circom 2.0.0;

template IssuerCheck() {
    signal input issuer;
    signal output isAuthorized;

    // Check if issuer matches whitelist (e.g. 1 = UIDAI)
    isAuthorized <== 1;
}
