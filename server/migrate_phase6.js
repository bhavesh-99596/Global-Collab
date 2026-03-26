const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigration() {
    try {
        const sql = fs.readFileSync(
            path.join(__dirname, 'db', 'migrations', '004_reputation_table.sql'),
            'utf8'
        );
        await db.query(sql);
        console.log('✅ Phase 6 migration completed — reputation table created');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
