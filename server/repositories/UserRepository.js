const db = require('../db');

class UserRepository {
    async findByEmailOrUsername(email, username) {
        const query = 'SELECT * FROM users WHERE email = $1 OR username = $2';
        const result = await db.query(query, [email, username]);
        return result.rows;
    }

    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0];
    }

    async findById(id) {
        const query = 'SELECT id, username, email, full_name, role, bio, location, website, github, twitter, reputation, skills, gender, avatar_url, created_at FROM users WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    async findByUsername(username) {
        const query = 'SELECT id, username, bio, skills, reputation, full_name, location, website, github, twitter, gender, avatar_url FROM users WHERE username = $1';
        const result = await db.query(query, [username]);
        return result.rows[0];
    }

    async createUser(username, email, passwordHash, fullName) {
        const query = `
            INSERT INTO users (username, email, password_hash, full_name) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, username, email, full_name, role, reputation
        `;
        const result = await db.query(query, [username, email, passwordHash, fullName || '']);
        return result.rows[0];
    }

    async updateUser(id, updateFields, updateValues) {
        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${updateValues.length} RETURNING id, username, bio, skills, reputation, full_name, location, website, github, twitter, gender, avatar_url`;
        const result = await db.query(query, updateValues);
        return result.rows[0];
    }

    async getTopUsers(limit = 50) {
        const query = 'SELECT id, username, full_name, role, skills, location, reputation FROM users ORDER BY reputation DESC LIMIT $1';
        const result = await db.query(query, [limit]);
        return result.rows;
    }
}

module.exports = new UserRepository();
