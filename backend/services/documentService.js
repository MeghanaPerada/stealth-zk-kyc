/**
 * Mock document parsing service.
 * In production, this would use OCR/Vision API to parse documents.
 */
const parseDocument = (file) => {
  // Simulating parsing delay and extracted data
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock extracted data
      resolve({
        parsedData: {
          pan: "ABCDE1234F",
          dob: "1990-01-01",
          name: "John Doe"
        },
        confidence: 0.95
      });
    }, 1000);
  });
};

/**
 * Get trust score based on data source
 * DigiLocker = 1.0 (Government verified)
 * Manual = 0.6 - 0.8 (User uploaded, parsed via OCR)
 */
const getTrustScore = (sourceType) => {
  if (sourceType === 'DIGILOCKER') {
    return 1.0;
  } else if (sourceType === 'MANUAL') {
    // Random score between 0.6 and 0.8
    return parseFloat((Math.random() * 0.2 + 0.6).toFixed(2));
  }
  return 0.5;
};

module.exports = {
  parseDocument,
  getTrustScore
};
