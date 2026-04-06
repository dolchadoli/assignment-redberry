function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isRequired(value) {
  return value != null && value.toString().trim().length > 0;
}

function hasMinLength(value, length) {
  return value != null && value.toString().trim().length >= length;
}

function isGeorgianMobile(value) {
  return /^5\d{8}$/.test(value);
}

export { isValidEmail, isRequired, hasMinLength, isGeorgianMobile };