// Validation and sanitization utilities

/**
 * Sanitize email input
 */
export function sanitizeEmail(email) {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(str) {
  if (!str) return '';
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 255); // Limit length
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone) {
  if (!phone) return '';
  return phone
    .trim()
    .replace(/[^\d+\-\s()]/g, '') // Keep only digits, +, -, spaces, parentheses
    .slice(0, 20); // Limit length
}

/**
 * Validate user input for registration
 */
export function validateUserInput(email, password, name) {
  const errors = [];

  // Email validation
  if (!email || email.length === 0) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Email format is invalid');
  } else if (email.length > 255) {
    errors.push('Email is too long');
  }

  // Password validation
  if (!password || password.length === 0) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  } else if (password.length > 128) {
    errors.push('Password is too long');
  }

  // Name validation
  if (!name || name.length === 0) {
    errors.push('Name is required');
  } else if (name.length < 2) {
    errors.push('Name must be at least 2 characters');
  } else if (name.length > 100) {
    errors.push('Name is too long');
  }

  return errors;
}

/**
 * Validate message input
 */
export function validateMessageInput(messageText) {
  const errors = [];

  if (!messageText || messageText.length === 0) {
    errors.push('Message text is required');
  } else if (messageText.length < 1) {
    errors.push('Message must be at least 1 character');
  } else if (messageText.length > 5000) {
    errors.push('Message is too long (max 5000 characters)');
  }

  return errors;
}

/**
 * Validate post input
 */
export function validatePostInput(title, description, operatorName) {
  const errors = [];

  if (!title || title.length === 0) {
    errors.push('Title is required');
  } else if (title.length < 3) {
    errors.push('Title must be at least 3 characters');
  } else if (title.length > 200) {
    errors.push('Title is too long (max 200 characters)');
  }

  if (!description || description.length === 0) {
    errors.push('Description is required');
  } else if (description.length < 10) {
    errors.push('Description must be at least 10 characters');
  } else if (description.length > 5000) {
    errors.push('Description is too long (max 5000 characters)');
  }

  if (!operatorName || operatorName.length === 0) {
    errors.push('Operator name is required');
  } else if (operatorName.length > 100) {
    errors.push('Operator name is too long');
  }

  return errors;
}

/**
 * Check if email format is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if password meets strength requirements
 */
function hasStrongPassword(password) {
  // Minimum requirements: at least 6 characters and contain letters or numbers
  // Allow simple passwords for better UX while still maintaining basic security
  const hasLettersOrNumbers = /[a-zA-Z0-9]/.test(password);
  return hasLettersOrNumbers;
}
