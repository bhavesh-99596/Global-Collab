const fs = require('fs');
const path = require('path');
const db = require('./db');
require('dotenv').config();

async function migratePhase7() {
    try {
        console.log('Running 005_points_payments.sql...');
        const initSql = fs.readFileSync(path.join(__dirname, 'db/migrations/005_points_payments.sql'), 'utf-8');
        await db.query(initSql);

        console.log('Backfilling monthly_points with total_points in reputation table...');
        await db.query('UPDATE reputation SET monthly_points = points WHERE monthly_points = 0');

        console.log('Seeding user_points table for existing users...');
        await db.query(`
            INSERT INTO user_points (user_id, total_points)
            SELECT id, 0 FROM users
            ON CONFLICT (user_id) DO NOTHING
        `);

        console.log('✅ Phase 7 migration completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    }
}

migratePhase7();
