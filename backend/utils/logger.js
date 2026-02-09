// Simple logger utility for the backend

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Format log message with timestamp and context
 */
function formatLog(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const context = Object.keys(data).length > 0 ? JSON.stringify(data) : '';
  return `[${timestamp}] [${level}] ${message} ${context}`.trim();
}

export const logger = {
  /**
   * Log error messages
   */
  error: (message, error = null, data = {}) => {
    const errorData = error ? { ...data, error: error.message, stack: error.stack } : data;
    console.error(formatLog(LOG_LEVELS.ERROR, message, errorData));
  },

  /**
   * Log warning messages
   */
  warn: (message, data = {}) => {
    console.warn(formatLog(LOG_LEVELS.WARN, message, data));
  },

  /**
   * Log info messages
   */
  info: (message, data = {}) => {
    console.log(formatLog(LOG_LEVELS.INFO, message, data));
  },

  /**
   * Log debug messages
   */
  debug: (message, data = {}) => {
    console.log(formatLog(LOG_LEVELS.DEBUG, message, data));
  },
};
