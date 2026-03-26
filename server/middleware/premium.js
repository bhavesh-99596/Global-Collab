const db = require('../db');

const premiumMiddleware = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT plan_id, status 
            FROM subscriptions 
            WHERE user_id = $1 AND status = 'active'
        `;
        const result = await db.query(query, [userId]);
        
        if (result.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Active subscription required. Please upgrade to a premium plan.' });
        }

        const plan = result.rows[0].plan_id;
        if (plan === 'free') {
            return res.status(403).json({ success: false, message: 'Premium plan required. Please upgrade to Pro or Team.' });
        }

        // Attach subscription info to request
        req.subscription = result.rows[0];
        next();
    } catch (err) {
        console.error('Premium middleware error:', err);
        res.status(500).json({ success: false, message: 'Server error while verifying premium status' });
    }
};

module.exports = premiumMiddleware;
