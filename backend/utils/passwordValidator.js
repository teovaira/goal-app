const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  return passwordRegex.test(password);
};

const getPasswordErrorMessage = () => {
  return "Password must be at least 8 characters long, contain 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character.";
};

module.exports = {
  validatePassword,
  getPasswordErrorMessage
};