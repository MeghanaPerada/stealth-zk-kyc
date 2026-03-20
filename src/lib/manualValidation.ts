// /src/lib/manualValidation.ts
// Format validation for manual KYC inputs

/**
 * validateManualKYC
 * Performs regex-based validation for identity attributes.
 */
export function validateManualKYC(data: any) {
  const errors: string[] = [];

  // PAN: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
  if (!data.pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan)) {
    errors.push("PAN must be in format ABCDE1234F");
  }

  // Aadhaar: 12 digits
  if (!data.aadhaar || !/^\d{12}$/.test(data.aadhaar)) {
    errors.push("Aadhaar must be exactly 12 digits");
  }

  // DOB: YYYY-MM-DD or YYYYMMDD (normalization handled in API)
  if (!data.dob || !/^\d{4}-?\d{2}-?\d{2}$/.test(data.dob)) {
    errors.push("DOB must be in YYYY-MM-DD format");
  }

  // Email (optional but validated if present)
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push("Invalid email format");
  }

  // Mobile: 10 digits
  if (data.mobile && !/^\d{10}$/.test(data.mobile)) {
    errors.push("Mobile must be exactly 10 digits");
  }

  return errors;
}
