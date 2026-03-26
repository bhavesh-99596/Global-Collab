module.exports = (timeoutMs = 10000) => {
    return (req, res, next) => {
        // Set timeout on the socket
        req.setTimeout(timeoutMs, () => {
            const err = new Error('Request Timeout');
            err.status = 408;
            next(err);
        });

        // Also set timeout on the response object
        res.setTimeout(timeoutMs, () => {
            const err = new Error('Service Unavailable (Timeout)');
            err.status = 503;
            next(err);
        });

        next();
    };
};
