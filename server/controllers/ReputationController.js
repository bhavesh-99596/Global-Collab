const reputationService = require('../services/reputation.service');

class ReputationController {
    async getReputation(req, res, next) {
        try {
            const userId = parseInt(req.params.userId, 10);
            const data = await reputationService.getReputation(userId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    async getLeaderboard(req, res, next) {
        try {
            const limit = parseInt(req.query.limit, 10) || 10;
            const type = req.query.type || 'alltime'; // 'monthly' or 'alltime'
            const data = await reputationService.getLeaderboard(limit, type);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new ReputationController();
