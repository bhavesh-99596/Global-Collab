const fs = require('fs');
const path = require('path');
const db = require('./index');

async function runMigrations() {
    try {
        console.log('Running database migrations...');
        const migrations = ['001_initial_schema.sql', '002_add_password_hash.sql'];
        for (const file of migrations) {
            console.log(`Executing ${file}...`);
            const sqlPath = path.join(__dirname, 'migrations', file);
            const sql = fs.readFileSync(sqlPath, 'utf8');
            await db.query(sql);
        }
        console.log('Migrations completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

runMigrations();
