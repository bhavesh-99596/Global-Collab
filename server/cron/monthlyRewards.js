const db = require('../db');
const pointsService = require('../services/PointsService');
const socketLib = require('../utils/socket');
const logger = require('../utils/logger');

// Reward mapping for top 10
const REWARDS = [1000, 750, 500, 300, 200, 150, 100, 75, 50, 25];

async function runDistribution() {
    logger.info('Starting monthly rewards distribution...');
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Fetch top 10 from reputation based on monthly_points
        const top10Res = await client.query(`
            SELECT user_id, monthly_points 
            FROM reputation 
            WHERE monthly_points > 0
            ORDER BY monthly_points DESC 
            LIMIT 10
        `);
        
        const winners = top10Res.rows;
        logger.info(`Found ${winners.length} users eligible for monthly rewards.`);

        // 2. Distribute points
        for (let i = 0; i < winners.length; i++) {
            const user = winners[i];
            const rewardPoints = REWARDS[i] || 0;
            if (rewardPoints > 0) {
                // We bypass PointsService here because we're inside a transaction
                await client.query(
                    `INSERT INTO user_points (user_id, total_points) 
                     VALUES ($1, $2)
                     ON CONFLICT (user_id) 
                     DO UPDATE SET total_points = user_points.total_points + $2, updated_at = NOW()`,
                    [user.user_id, rewardPoints]
                );

                await client.query(
                    `INSERT INTO points_transactions (user_id, points, type, description)
                     VALUES ($1, $2, 'earn', $3)`,
                    [user.user_id, rewardPoints, `Monthly Leaderboard Rank #${i + 1} Reward`]
                );
            }
        }

        // 3. Reset monthly_points to 0 for all users
        await client.query(`UPDATE reputation SET monthly_points = 0`);
        
        await client.query('COMMIT');
        logger.info('Monthly rewards distribution completed successfully.');
        
        // Broadcast to clients
        try { socketLib.getIo().emit('leaderboardUpdated'); } catch (_) {}
        
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Error distributing monthly rewards:', e);
        throw e;
    } finally {
        client.release();
    }
}

module.exports = {
    runDistribution
};
