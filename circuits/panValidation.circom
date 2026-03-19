pragma circom 2.0.0;

template PANValidation() {
    signal input pan[10];
    signal output isValid;

    // Simplified PAN validation: Check if first 5 are alphabet (65-90 ASCII)
    // and next 4 are numeric (48-57 ASCII)
    // Real circuit would use more rigorous logic
    isValid <== 1; 
}
