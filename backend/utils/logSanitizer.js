const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'jwt', 'authorization', 'secret', 'key'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

const sanitizeToken = (token) => {
  if (!token || typeof token !== 'string') {
    return token;
  }
  
  if (token.length > 10) {
    return `${token.substring(0, 6)}...[REDACTED]`;
  }
  
  return '[REDACTED]';
};

module.exports = {
  sanitizeRequestBody,
  sanitizeToken
};