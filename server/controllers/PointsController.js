const pointsService = require('../services/PointsService');
const monthlyRewards = require('../cron/monthlyRewards'); // Exported for manual trigger testing

class PointsController {
    async getPoints(req, res, next) {
        try {
            const points = await pointsService.getWallet(req.user.id);
            res.json({ success: true, data: { total_points: points } });
        } catch (err) {
            next(err);
        }
    }
    
    async getHistory(req, res, next) {
        try {
            const history = await pointsService.getHistory(req.user.id);
            res.json({ success: true, data: history });
        } catch (err) {
            next(err);
        }
    }

    async distributeMonthlyRewards(req, res, next) {
        try {
            // Exposed for manual testing via POST /api/rewards/distribute
            await monthlyRewards.runDistribution();
            res.json({ success: true, message: 'Monthly rewards distributed successfully and leaders reset.' });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new PointsController();
