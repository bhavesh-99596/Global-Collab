const subscriptionService = require('../services/SubscriptionService');

const verifyUsageLimit = (limitType) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const sub = await subscriptionService.getSubscription(userId);
            
            if (!sub || !sub.usage) {
                return next(); // Default fallback
            }

            // If limit is null, it means unlimited.
            const limitVal = sub.usage[`${limitType}_limit`];
            const currentUsage = sub.usage[limitType];

            if (limitVal !== null && currentUsage >= limitVal) {
                return res.status(403).json({
                    success: false,
                    error: 'quota_exceeded',
                    message: `You have reached your ${limitType.toUpperCase()} limit of ${limitVal} on the ${sub.plan_name?.toUpperCase() || 'current'} plan. Please upgrade to continue.`
                });
            }

            next();
        } catch (err) {
            console.error(`Error in verifyUsageLimit(${limitType}):`, err);
            next(err);
        }
    };
};

module.exports = {
    checkProjectLimit: verifyUsageLimit('project'),
    checkMemberLimit: verifyUsageLimit('member'),
    checkAILimit: verifyUsageLimit('ai'),
    checkStorageLimit: verifyUsageLimit('storage')
};
