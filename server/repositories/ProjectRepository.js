const db = require('../db');

class ProjectRepository {
    async findAllByOwnerId(ownerId) {
        const query = 'SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 100';
        const result = await db.query(query, [ownerId]);
        return result.rows;
    }

    async findByIdAndOwner(id, ownerId) {
        const query = 'SELECT * FROM projects WHERE id = $1 AND owner_id = $2';
        const result = await db.query(query, [id, ownerId]);
        return result.rows[0];
    }

    async findById(id) {
        const query = 'SELECT * FROM projects WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    async getProjectMembers(projectId) {
        const query = `
            SELECT owner_id as user_id FROM projects WHERE id = $1
            UNION
            SELECT user_id FROM project_members WHERE project_id = $1
        `;
        const result = await db.query(query, [projectId]);
        return result.rows;
    }

    async addMember(projectId, userId) {
        // Prevent duplicate inserts
        const checkQuery = 'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2';
        const check = await db.query(checkQuery, [projectId, userId]);
        if (check.rows.length > 0) return check.rows[0];

        const query = 'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) RETURNING *';
        const result = await db.query(query, [projectId, userId]);
        return result.rows[0];
    }

    async create(title, description, techStack, deadline, ownerId) {
        const query = `
            INSERT INTO projects (title, description, tech_stack, deadline, owner_id) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
        `;
        const result = await db.query(query, [title, description, techStack, deadline || null, ownerId]);
        return result.rows[0];
    }

    async update(id, ownerId, title, description, techStack, deadline) {
        const query = `
            UPDATE projects 
            SET title = $1, description = $2, tech_stack = $3, deadline = $4 
            WHERE id = $5 AND owner_id = $6 
            RETURNING *
        `;
        const result = await db.query(query, [title, description, techStack, deadline || null, id, ownerId]);
        return result.rows[0];
    }

    async delete(id, ownerId) {
        const query = 'DELETE FROM projects WHERE id = $1 AND owner_id = $2 RETURNING *';
        const result = await db.query(query, [id, ownerId]);
        return result.rows[0];
    }
}

module.exports = new ProjectRepository();
