const analyticsRepository = require('../repositories/AnalyticsRepository');

class AnalyticsService {
    // ── Existing ────────────────────────────────────────────────────────────

    async getTasksPerWeek(userId) {
        let data = await analyticsRepository.getTasksPerWeek(userId);
        if (!data || data.length === 0) {
            data = [
                { name: 'Mon', tasks: 0, commits: 0 },
                { name: 'Tue', tasks: 0, commits: 0 },
                { name: 'Wed', tasks: 0, commits: 0 },
                { name: 'Thu', tasks: 0, commits: 0 },
                { name: 'Fri', tasks: 0, commits: 0 },
                { name: 'Sat', tasks: 0, commits: 0 },
                { name: 'Sun', tasks: 0, commits: 0 }
            ];
        }
        return data;
    }

    async getProjectActivity(userId) {
        let data = await analyticsRepository.getProjectActivity(userId);
        if (!data || data.length === 0) {
            return [
                { name: 'Week 1', active: 0, completed: 0 },
                { name: 'Week 2', active: 0, completed: 0 },
                { name: 'Week 3', active: 0, completed: 0 },
                { name: 'Week 4', active: 0, completed: 0 },
                { name: 'Week 5', active: 0, completed: 0 }
            ];
        }
        return data;
    }

    async getReputationGrowth(userId) {
        return await analyticsRepository.getReputationGrowth(userId);
    }

    // ── New ─────────────────────────────────────────────────────────────────

    async getTasksPerProject(userId) {
        return await analyticsRepository.getTasksPerProject(userId) || [];
    }

    async getProjectProgress(userId) {
        return await analyticsRepository.getProjectProgress(userId) || [];
    }

    async getTaskStatusDistribution(userId) {
        return await analyticsRepository.getTaskStatusDistribution(userId) || [];
    }

    async getTeamContribution(userId) {
        return await analyticsRepository.getTeamContribution(userId) || [];
    }

    async getOverdueTasks(userId) {
        return await analyticsRepository.getOverdueTasks(userId) || [];
    }
}

module.exports = new AnalyticsService();
