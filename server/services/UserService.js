const userRepository = require('../repositories/UserRepository');
const db = require('../db'); // Note: Tasks query should ideally fall into a TaskRepository, but we'll adapt

class UserService {
    async getProfile(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            const err = new Error('User not found');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }

        // Ideally moved to TaskRepository
        const tasksResult = await db.query(
            "SELECT COUNT(*) FROM tasks WHERE assigned_user_id = $1 AND status = 'Done'",
            [userId]
        );

        return {
            ...user,
            completed_tasks: parseInt(tasksResult.rows[0].count, 10) || 0
        };
    }

    async updateProfile(userId, data) {
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        const allowedFields = ['bio', 'skills', 'location', 'full_name', 'website', 'github', 'twitter', 'gender'];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updateFields.push(`${field} = $${paramIndex++}`);
                updateValues.push(data[field]);
            }
        }

        if (updateFields.length === 0) {
            const err = new Error('No fields provided for update');
            err.statusCode = 400;
            err.isOperational = true;
            throw err;
        }

        updateValues.push(userId);
        const user = await userRepository.updateUser(userId, updateFields, updateValues);

        if (!user) {
            const err = new Error('User not found');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }

        return user;
    }

    async getPublicPortfolio(username) {
        const user = await userRepository.findByUsername(username);
        if (!user) {
            const err = new Error('User not found');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }

        // Fetch their public/featured projects (limit to 3 for now, like the static design)
        const projectsResult = await db.query(
            "SELECT id, name, description, tech_stack as technologies, link FROM projects WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 3",
            [user.id]
        );

        user.portfolioProjects = projectsResult.rows.map(p => ({
            ...p,
            technologies: Array.isArray(p.technologies) ? p.technologies : (p.technologies ? p.technologies.split(',') : [])
        }));

        return user;
    }

    async getAllUsers() {
        return await userRepository.getTopUsers(50);
    }
}

module.exports = new UserService();
