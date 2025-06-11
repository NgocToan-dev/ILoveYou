/**
 * Custom request logger middleware
 * Logs incoming requests with additional context
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log incoming request
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // Override res.end to log response details
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    
    console.log(`📤 ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${statusEmoji} ${statusCode} - ${duration}ms`);
    
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = requestLogger;