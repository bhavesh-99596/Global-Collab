const db = require('../db');

class AdminController {
    /**
     * GET /api/admin/users — List all users with key info
     */
    async listUsers(req, res, next) {
        try {
            const result = await db.query(`
                SELECT id, username, email, full_name, role, reputation, created_at
                FROM users
                ORDER BY created_at DESC
            `);
            res.json({ success: true, data: result.rows });
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /api/admin/users/:id — Delete a user by ID
     * Cannot delete yourself (the admin).
     */
    async deleteUser(req, res, next) {
        try {
            const targetId = parseInt(req.params.id);
            if (targetId === req.user.id) {
                return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
            }

            // Check user exists
            const check = await db.query('SELECT id, username, role FROM users WHERE id = $1', [targetId]);
            if (check.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Prevent deleting other admins (safety)
            if (check.rows[0].role === 'admin') {
                return res.status(403).json({ success: false, message: 'Cannot delete another admin' });
            }

            await db.query('DELETE FROM users WHERE id = $1', [targetId]);
            res.json({ success: true, message: `User "${check.rows[0].username}" deleted successfully` });
        } catch (err) {
            next(err);
        }
    }

    /**
     * PUT /api/admin/users/:id/role — Change a user's role
     * Body: { role: 'admin' | 'Developer' | 'Designer' | ... }
     */
    async changeRole(req, res, next) {
        try {
            const targetId = parseInt(req.params.id);
            const { role } = req.body;
            if (!role) {
                return res.status(400).json({ success: false, message: 'Role is required' });
            }

            // Prevent admin from demoting themselves
            if (targetId === req.user.id && role !== 'admin') {
                return res.status(403).json({ success: false, message: 'You cannot remove your own admin role' });
            }

            const result = await db.query(
                'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role',
                [role, targetId]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AdminController();
