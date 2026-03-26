const db = require('../db');

class AnalyticsRepository {
    // ── Existing Methods ────────────────────────────────────────────────────

    async getTasksPerWeek(userId) {
        const query = `
            SELECT 
              to_char(completed_at, 'Dy') as name,
              COUNT(*) as tasks,
              FLOOR(RANDOM() * 10) as commits
            FROM tasks 
            WHERE status = 'Done' 
              AND assigned_user_id = $1
              AND completed_at >= NOW() - INTERVAL '7 days'
            GROUP BY name, DATE(completed_at)
            ORDER BY DATE(completed_at) ASC
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    async getProjectActivity(userId) {
        const query = `
            SELECT 
              'Week ' || to_char(created_at, 'W') as name,
              COUNT(CASE WHEN status != 'Completed' THEN 1 END) as active,
              COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed
            FROM projects
            WHERE owner_id = $1 OR id IN (SELECT project_id FROM tasks WHERE assigned_user_id = $1)
            GROUP BY name
            ORDER BY name ASC
            LIMIT 5
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    async getReputationGrowth(userId) {
        const query = `SELECT reputation FROM users WHERE id = $1`;
        const result = await db.query(query, [userId]);
        const currentRep = result.rows[0]?.reputation || 0;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthIdx = new Date().getMonth();
        let growth = [];
        let rep = currentRep;
        for (let i = 0; i < 6; i++) {
            let monthIdx = (currentMonthIdx - i + 12) % 12;
            growth.unshift({ month: months[monthIdx], score: Math.round(rep) });
            rep = rep * 0.8;
        }
        return growth;
    }

    // ── New Analytics Methods ────────────────────────────────────────────────

    /**
     * Count completed tasks per project for user's accessible projects
     */
    async getTasksPerProject(userId) {
        const query = `
            SELECT 
              p.name AS project,
              COUNT(t.id) FILTER (WHERE t.status = 'Done') AS completed
            FROM projects p
            LEFT JOIN tasks t ON t.project_id = p.id
            WHERE p.owner_id = $1
               OR p.id IN (
                   SELECT DISTINCT project_id FROM tasks WHERE assigned_user_id = $1
               )
            GROUP BY p.id, p.name
            ORDER BY completed DESC
            LIMIT 10
        `;
        const result = await db.query(query, [userId]);
        return result.rows.map(r => ({
            project: r.project,
            completed: parseInt(r.completed) || 0
        }));
    }

    /**
     * Progress per project: completed / total × 100
     */
    async getProjectProgress(userId) {
        const query = `
            SELECT 
              p.id,
              p.name AS project,
              COUNT(t.id) AS total,
              COUNT(t.id) FILTER (WHERE t.status = 'Done') AS completed
            FROM projects p
            LEFT JOIN tasks t ON t.project_id = p.id
            WHERE p.owner_id = $1
               OR p.id IN (
                   SELECT DISTINCT project_id FROM tasks WHERE assigned_user_id = $1
               )
            GROUP BY p.id, p.name
            ORDER BY p.name ASC
            LIMIT 8
        `;
        const result = await db.query(query, [userId]);
        return result.rows.map(r => {
            const total = parseInt(r.total) || 0;
            const completed = parseInt(r.completed) || 0;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            return { project: r.project, total, completed, progress };
        });
    }

    /**
     * Count of tasks grouped by status across all user accessible tasks
     */
    async getTaskStatusDistribution(userId) {
        const query = `
            SELECT 
              status,
              COUNT(*) AS count
            FROM tasks
            WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = $1
                UNION
                SELECT DISTINCT project_id FROM tasks WHERE assigned_user_id = $1
            )
            GROUP BY status
        `;
        const result = await db.query(query, [userId]);
        // Normalize status labels
        const labelMap = {
            'Todo': 'To Do',
            'todo': 'To Do',
            'In Progress': 'In Progress',
            'in_progress': 'In Progress',
            'Done': 'Done',
            'done': 'Done',
            'Review': 'Review'
        };
        return result.rows.map(r => ({
            status: labelMap[r.status] || r.status,
            count: parseInt(r.count) || 0
        }));
    }

    /**
     * Number of completed tasks per team member on user's projects
     */
    async getTeamContribution(userId) {
        const query = `
            SELECT 
              u.username AS member,
              u.full_name AS fullName,
              COUNT(t.id) FILTER (WHERE t.status = 'Done') AS completed
            FROM tasks t
            JOIN users u ON u.id = t.assigned_user_id
            WHERE t.project_id IN (
                SELECT id FROM projects WHERE owner_id = $1
                UNION
                SELECT DISTINCT project_id FROM tasks WHERE assigned_user_id = $1
            )
            GROUP BY u.id, u.username, u.full_name
            ORDER BY completed DESC
            LIMIT 10
        `;
        const result = await db.query(query, [userId]);
        return result.rows.map(r => ({
            member: r.fullname || r.member,
            completed: parseInt(r.completed) || 0
        }));
    }

    /**
     * Tasks where deadline < NOW() and status != Done
     */
    async getOverdueTasks(userId) {
        const query = `
            SELECT 
              t.id,
              t.title,
              t.deadline,
              t.status,
              p.name AS project,
              u.username AS assignee
            FROM tasks t
            LEFT JOIN projects p ON p.id = t.project_id
            LEFT JOIN users u ON u.id = t.assigned_user_id
            WHERE t.deadline IS NOT NULL
              AND t.deadline < NOW()
              AND t.status != 'Done'
              AND (
                  t.project_id IN (SELECT id FROM projects WHERE owner_id = $1)
                  OR t.assigned_user_id = $1
              )
            ORDER BY t.deadline ASC
            LIMIT 20
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }
}

module.exports = new AnalyticsRepository();

