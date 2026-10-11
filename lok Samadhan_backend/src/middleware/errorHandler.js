const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('[Error Occurred]', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : undefined);
};

const notFoundHandler = (req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
