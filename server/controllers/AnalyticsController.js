const analyticsService = require('../services/AnalyticsService');

class AnalyticsController {
    // ── Existing ────────────────────────────────────────────────────────────

    async getTasksPerWeek(req, res, next) {
        try {
            const data = await analyticsService.getTasksPerWeek(req.user.userId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    async getProjectActivity(req, res, next) {
        try {
            const data = await analyticsService.getProjectActivity(req.user.userId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    async getReputationGrowth(req, res, next) {
        try {
            const data = await analyticsService.getReputationGrowth(req.user.userId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    // ── New ─────────────────────────────────────────────────────────────────

    async getTasksPerProject(req, res, next) {
        try {
            const data = await analyticsService.getTasksPerProject(req.user.userId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    async getProjectProgress(req, res, next) {
        try {
            const data = await analyticsService.getProjectProgress(req.user.userId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    async getTaskStatus(req, res, next) {
        try {
            const data = await analyticsService.getTaskStatusDistribution(req.user.userId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    async getTeamContribution(req, res, next) {
        try {
            const data = await analyticsService.getTeamContribution(req.user.userId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    async getOverdueTasks(req, res, next) {
        try {
            const data = await analyticsService.getOverdueTasks(req.user.userId);
            res.json({ success: true, data, count: data.length });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AnalyticsController();

