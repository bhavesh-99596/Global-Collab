const activityRepository = require('../repositories/ActivityRepository');

class ActivityService {
    async logActivity(type, content, projectId, userId) {
        try {
            return await activityRepository.createLog(type, content, projectId, userId);
        } catch (error) {
            console.error('Error logging activity:', error);
            // Log errors shouldn't crash main operations
            return null;
        }
    }

    async getRecentActivity(limit) {
        return await activityRepository.getRecentActivity(limit);
    }
}

module.exports = new ActivityService();
