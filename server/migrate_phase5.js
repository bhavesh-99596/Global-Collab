require('dotenv').config();
const db = require('./db');

async function migrate() {
    try {
        console.log('Running migrations...');
        await db.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS project_id INT REFERENCES projects(id) ON DELETE CASCADE');
        await db.query('ALTER TABLE messages ALTER COLUMN receiver_id DROP NOT NULL');
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                title TEXT,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT FALSE
            )
        `);
        console.log('Migration successful');
    } catch(err) {
        console.error('Migration failed:', err.message);
    } finally {
        process.exit(0);
    }
}

migrate();
