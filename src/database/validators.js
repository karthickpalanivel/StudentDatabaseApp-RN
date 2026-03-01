// src/database/validators.js

export const validatePhone = (phone) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password) => {
  return password && password.length >= 8;
};

export const validateZipCode = (zipCode) => {
  const zipRegex = /^\d{6}$/;
  return zipRegex.test(zipCode);
};

export const validateDOB = (dob) => {
  // Regex explanation:
  // (0[1-9]|[12][0-9]|3[01]) -> Day: 01-31
  // (0[1-9]|1[012])          -> Month: 01-12
  // \d{4}                    -> Year: 4 digits
  const dobRegex = /^(0[1-9]|[12][0-9]|3[01])(0[1-9]|1[012])\d{4}$/;
  return dobRegex.test(dob);
};

export const validateSection = (section) => {
  const sectionRegex = /^[A-Za-z]{1}$/;
  return sectionRegex.test(section);
};
