const db = require('../db');

/**
 * Admin-only middleware.
 * Must be used AFTER the auth middleware so req.user is available.
 * Checks the user's role in the database to prevent stale JWT claims.
 */
const adminMiddleware = async (req, res, next) => {
    try {
        const result = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
        if (!result.rows[0] || result.rows[0].role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        next();
    } catch (err) {
        console.error('Admin middleware error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = adminMiddleware;
