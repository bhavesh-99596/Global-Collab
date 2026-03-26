const subscriptionService = require('../services/SubscriptionService');

class SubscriptionController {
    async getSubscription(req, res, next) {
        try {
            const userId = req.user.id; // Fixed reference
            const subscription = await subscriptionService.getSubscription(userId);

            res.json({
                success: true,
                data: subscription
            });
        } catch (err) {
            next(err);
        }
    }

    async getPlans(req, res, next) {
        try {
            const plans = await subscriptionService.getPlans();
            res.json({
                success: true,
                data: plans
            });
        } catch (err) {
            next(err);
        }
    }

    async upgradeSubscription(req, res, next) {
        try {
            const userId = req.user.id;
            const { plan } = req.body;

            if (!plan) {
                const err = new Error('Plan is required');
                err.statusCode = 400;
                err.isOperational = true;
                throw err;
            }

            const updatedSubscription = await subscriptionService.upgradeSubscription(userId, plan);

            res.json({
                success: true,
                message: `Successfully upgraded to ${plan} plan`,
                data: updatedSubscription
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new SubscriptionController();
