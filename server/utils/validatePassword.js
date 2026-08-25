// Shared password complexity rule used by registration, change-password,
// and reset-password so all three enforce exactly the same policy.
const PASSWORD_MIN_LENGTH = 8;

// Returns an error message string if the password fails the policy,
// or null if it passes.
const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'Password must contain at least one letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
};

module.exports = validatePassword;
