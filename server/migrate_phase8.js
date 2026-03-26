const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('./db');

async function runMigration() {
    console.log('--- Starting Phase 8 Migrations: Dynamic Plans ---');
    try {
        const sqlPath = path.join(__dirname, 'db', 'migrations', '006_dynamic_plans.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running 006_dynamic_plans.sql schema definitions...');
        await db.query(sql);

        console.log('Seeding default Plans to DB...');
        const plans = [
            {
                id: 'free',
                name: 'Free',
                price_inr: 0,
                billing_type: 'forever',
                project_limit: 3,
                member_limit: 1,
                ai_limit: 10,
                storage_limit: 100, // 100MB
                features: JSON.stringify(['Up to 3 Active Projects', 'Basic Task Board', 'Standard Activity Feed', 'Community Support'])
            },
            {
                id: 'pro',
                name: 'Pro',
                price_inr: 999,
                billing_type: 'monthly',
                project_limit: null, // Unlimited
                member_limit: 5,
                ai_limit: 100,
                storage_limit: 5000, // 5GB
                features: JSON.stringify(['Unlimited Projects', 'AI Task Generation', 'AI Team Builder', 'Advanced Analytics', 'Priority Support'])
            },
            {
                id: 'team',
                name: 'Team',
                price_inr: 3999,
                billing_type: 'monthly',
                project_limit: null, // Unlimited
                member_limit: null,  // Unlimited
                ai_limit: null,      // Unlimited
                storage_limit: 50000, // 50GB
                features: JSON.stringify(['Everything in PRO', 'Team Collaboration Tools', 'Custom Workflows', 'Admin Dashboard', 'SAML SSO & CSM'])
            }
        ];

        for (const p of plans) {
            await db.query(`
                INSERT INTO plans (id, name, price_inr, billing_type, project_limit, member_limit, ai_limit, storage_limit, features)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    price_inr = EXCLUDED.price_inr,
                    billing_type = EXCLUDED.billing_type,
                    project_limit = EXCLUDED.project_limit,
                    member_limit = EXCLUDED.member_limit,
                    ai_limit = EXCLUDED.ai_limit,
                    storage_limit = EXCLUDED.storage_limit,
                    features = EXCLUDED.features
            `, [p.id, p.name, p.price_inr, p.billing_type, p.project_limit, p.member_limit, p.ai_limit, p.storage_limit, p.features]);
        }
        console.log('Plans seeded successfully!');
        
        // Convert any existing NULL plan_ids to 'free' and set active status
        await db.query(`
            UPDATE subscriptions 
            SET plan_id = 'free',
                status = 'active',
                start_date = CURRENT_TIMESTAMP
            WHERE plan_id IS NULL
        `);
        console.log('Subscriptions normalized.');

        console.log('--- Phase 8 Migrations Completed Successfully! ---');
        process.exit(0);

    } catch (err) {
        fs.writeFileSync('migration_error.txt', String(err.stack || err));
        console.error('Migration Failed:', err);
        process.exit(1);
    }
}

runMigration();
