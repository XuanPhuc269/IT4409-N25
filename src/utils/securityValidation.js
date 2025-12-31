export const nameRegex = /^[a-zA-ZÀ-ỹ0-9 ]+$/;
export const xssPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gim;

export const validateInput = (input, maxLength = 1000) => {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Input is required' };
  }

  const trimmedInput = input.trim();

  if (trimmedInput.length === 0) {
    return { isValid: false, error: 'Input cannot be empty' };
  }

  if (trimmedInput.length > maxLength) {
    return { isValid: false, error: `Input exceeds maximum length of ${maxLength} characters` };
  }

  if (xssPattern.test(trimmedInput)) {
    return { isValid: false, error: 'Invalid characters detected' };
  }

  return { isValid: true, sanitized: trimmedInput };
};

export const sanitizeHtml = (html) => {
  return html
    .replace(xssPattern, '')
    .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gim, ''); 
};