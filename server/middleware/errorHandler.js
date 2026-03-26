/**
 * GlobalCollab
 * Global Error Handling Middleware
 */

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Unhandled Server Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        // Include stack trace only in development
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

module.exports = errorHandler;
