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

        const allowedFields = ['bio', 'skills', 'location', 'full_name', 'website', 'github', 'twitter'];

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
        return user;
    }

    async getAllUsers() {
        return await userRepository.getTopUsers(50);
    }
}

module.exports = new UserService();
