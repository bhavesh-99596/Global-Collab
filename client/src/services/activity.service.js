import { api } from './api';

export const activityService = {
    /**
     * Fetches recent activities for the global feed or a specific user
     * @param {string|number|null} userId Optional filter for specific user
     * @returns {Promise<Array>} Array of activity objects
     */
    async getRecentActivities(limit = 10, projectId = null, userId = null) {
        try {
            let endpoint = `/activity?limit=${limit}`;
            if (userId) endpoint += `&userId=${userId}`;
            if (projectId) endpoint += `&projectId=${projectId}`;

            const response = await api.get(endpoint);
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch activity data', error);
            return [];
        }
    }
};
