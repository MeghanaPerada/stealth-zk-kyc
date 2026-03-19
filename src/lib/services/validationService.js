const { MIN_AGE } = require('../config/env');

/**
 * Validates an Indian PAN card format
 * Format: 5 uppercase letters, 4 digits, 1 uppercase letter
 */
const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

/**
 * Calculates age from Date of Birth and validates minimum age
 */
const calculateAge = (dobString) => {
  const dob = new Date(dobString);
  const now = new Date();
  
  if (isNaN(dob.getTime())) {
    throw new Error('Invalid Date of Birth format');
  }

  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }

  return age;
};

const isAdult = (dobString) => {
  const age = calculateAge(dobString);
  return age >= MIN_AGE;
};

module.exports = {
  validatePAN,
  calculateAge,
  isAdult
};
