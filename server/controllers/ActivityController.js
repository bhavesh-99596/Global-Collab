const activityService = require('../services/ActivityService');

class ActivityController {
    async getRecentActivity(req, res, next) {
        try {
            const limit = parseInt(req.query.limit, 10) || 50;
            const activity = await activityService.getRecentActivity(limit);

            res.json({ success: true, data: activity });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new ActivityController();
