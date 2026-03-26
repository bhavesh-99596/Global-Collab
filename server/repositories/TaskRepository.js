const db = require('../db');

class TaskRepository {
    async findAll(projectId = null) {
        let query = 'SELECT * FROM tasks';
        let params = [];

        if (projectId) {
            query += ' WHERE project_id = $1';
            params.push(projectId);
        }

        query += ' ORDER BY created_at DESC LIMIT 200';
        const result = await db.query(query, params);
        return result.rows;
    }

    async findById(id) {
        const query = 'SELECT * FROM tasks WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    async create(title, description, priority, dbStatus, deadline, projectId, assigneeId) {
        const query = `
            INSERT INTO tasks (title, description, priority, status, deadline, project_id, assigned_user_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *
        `;
        const result = await db.query(query, [title, description, priority || 'medium', dbStatus, deadline, projectId, assigneeId]);
        return result.rows[0];
    }

    async createBulk(tasksArray, projectId, assigneeId = null) {
        if (!tasksArray || tasksArray.length === 0) return [];
        
        let values = [];
        let params = [];
        let paramIndex = 1;

        for (const task of tasksArray) {
            values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
            params.push(
                task.title,
                task.description,
                task.priority || 'medium',
                task.status || 'Todo',
                task.deadline || new Date().toISOString(),
                projectId,
                assigneeId
            );
        }

        const query = `
            INSERT INTO tasks (title, description, priority, status, deadline, project_id, assigned_user_id) 
            VALUES ${values.join(', ')} 
            RETURNING *
        `;
        const result = await db.query(query, params);
        return result.rows;
    }

    async update(id, updateFields, updateValues) {
        const query = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = $${updateValues.length} RETURNING *`;
        const result = await db.query(query, updateValues);
        return result.rows[0];
    }

    async delete(id) {
        const query = 'DELETE FROM tasks WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = new TaskRepository();
