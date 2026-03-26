/**
 * GlobalCollab Analytics Service
 * Fetches all analytics data for the dashboard.
 */

import { api } from './api';

export const analyticsService = {
    /**
     * Legacy: used by the old Analytics.jsx views
     */
    async getDashboardData(filter = 'Last 30 Days') {
        try {
            const [tasksRes, projectsRes, repRes, meRes, usersRes] = await Promise.all([
                api.get('/analytics/tasks-per-week'),
                api.get('/analytics/project-activity'),
                api.get('/analytics/reputation-growth'),
                api.get('/users/me'),
                api.get('/users')
            ]);

            const user = meRes.data || {};
            const totalTasks = user.completed_tasks || 0;
            const weeklyTasks = tasksRes.data || [];
            const recentTasksSum = weeklyTasks.reduce((sum, day) => sum + parseInt(day.tasks || 0), 0);
            const totalUsers = usersRes.data ? usersRes.data.length : 0;

            return {
                stats: [
                    { title: 'Total Tasks Completed', value: totalTasks, trend: { value: '+2', label: 'vs last month', isPositive: true } },
                    { title: 'Weekly Velocity', value: recentTasksSum, trend: { value: 'tasks/week', label: 'current pace', isPositive: true } },
                    { title: 'Project Success Rate', value: '98%', trend: { value: '+2%', label: 'vs last quarter', isPositive: true } },
                    { title: 'Network Size', value: totalUsers, trend: { value: '+3', label: 'new connections', isPositive: true } }
                ],
                weeklyActivityData: tasksRes.data || [],
                projectActivityData: projectsRes.data || [],
                reputationGrowthData: repRes.data || []
            };
        } catch (error) {
            console.error('Failed to fetch analytics data', error);
            throw error;
        }
    },

    /**
     * New: fetch all 5 analytics panels in parallel
     */
    async getAnalyticsDashboard() {
        const [
            tasksPerProjectRes,
            projectProgressRes,
            taskStatusRes,
            teamContributionRes,
            overdueTasksRes
        ] = await Promise.allSettled([
            api.get('/analytics/tasks-per-project'),
            api.get('/analytics/project-progress'),
            api.get('/analytics/task-status'),
            api.get('/analytics/team-contribution'),
            api.get('/analytics/overdue-tasks')
        ]);

        const extract = (settled) =>
            settled.status === 'fulfilled' ? (settled.value?.data || []) : [];

        return {
            tasksPerProject: extract(tasksPerProjectRes),
            projectProgress: extract(projectProgressRes),
            taskStatus: extract(taskStatusRes),
            teamContribution: extract(teamContributionRes),
            overdueTasks: overdueTasksRes.status === 'fulfilled'
                ? {
                    count: overdueTasksRes.value?.count || 0,
                    tasks: overdueTasksRes.value?.data || []
                  }
                : { count: 0, tasks: [] }
        };
    }
};
