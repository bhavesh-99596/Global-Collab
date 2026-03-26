const reputationRepository = require('../repositories/ReputationRepository');
const db = require('../db');
const socketLib = require('../utils/socket');

/**
 * Point thresholds → level mapping
 */
const LEVELS = [
    { min: 2500, label: 'Top Contributor' },
    { min: 1000, label: 'Expert' },
    { min: 500,  label: 'Professional' },
    { min: 100,  label: 'Contributor' },
    { min: 0,    label: 'Beginner' },
];

class ReputationService {
    /**
     * Pure function — returns the rank label for a given point total.
     */
    calculateLevel(points) {
        for (const lvl of LEVELS) {
            if (points >= lvl.min) return lvl.label;
        }
        return 'Beginner';
    }

    /**
     * Central point mutation — updates repo and logs activity.
     */
    async addPoints(userId, delta, reason = '') {
        const row = await reputationRepository.upsertPoints(userId, delta);

        // Also keep users.reputation in sync for backward compat
        try {
            await db.query(
                `UPDATE users SET reputation = GREATEST(COALESCE(reputation, 0) + $1, 0) WHERE id = $2`,
                [delta, userId]
            );
        } catch (_) { /* non-critical */ }

        // Activity feed entry
        try {
            await db.query(
                `INSERT INTO activity_feed (type, content, user_id)
                 VALUES ($1, $2, $3)`,
                [
                    delta >= 0 ? 'points_earned' : 'points_lost',
                    `${delta >= 0 ? '+' : ''}${delta} points: ${reason}`,
                    userId
                ]
            );
        } catch (_) { /* non-critical */ }

        // Emit Real-time Update
        try {
            const io = socketLib.getIo();
            io.emit('reputationUpdated', { userId, points: row.points, level: this.calculateLevel(row.points), delta });
        } catch (_) { /* non-critical */ }

        return { points: row.points, level: this.calculateLevel(row.points) };
    }

    async getReputation(userId) {
        const row = await reputationRepository.getReputation(userId);
        return { points: row.points, level: this.calculateLevel(row.points) };
    }

    async getLeaderboard(limit = 10, type = 'alltime') {
        const rows = await reputationRepository.getLeaderboard(limit, type);
        return rows.map(r => ({
            userId: r.user_id,
            username: r.username,
            fullName: r.full_name,
            role: r.role,
            points: r.points,
            monthlyPoints: r.monthly_points,
            level: this.calculateLevel(r.points),
        }));
    }

    /* ─── Event Convenience Methods ─── */

    async onCreateProject(userId) {
        return this.addPoints(userId, 20, 'Created a new project');
    }

    async onCompleteProject(userId) {
        return this.addPoints(userId, 50, 'Completed a project');
    }

    async onLeaveProject(userId) {
        return this.addPoints(userId, -10, 'Left a project');
    }

    async onTaskDone(userId) {
        return this.addPoints(userId, 10, 'Completed a task');
    }

    async onTaskOverdue(userId) {
        return this.addPoints(userId, -5, 'Task went overdue');
    }

    async onBugTaskDone(userId) {
        return this.addPoints(userId, 15, 'Fixed a bug');
    }

    async onComment(userId) {
        return this.addPoints(userId, 2, 'Commented on a task');
    }

    async onMessage(userId) {
        return this.addPoints(userId, 2, 'Sent a chat message');
    }

    async onFileUpload(userId) {
        return this.addPoints(userId, 5, 'Uploaded a file');
    }
}

module.exports = new ReputationService();
