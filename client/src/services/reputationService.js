// In a real app this would interact with the Backend API / Database
// For Module 12 we will implement the logic of the Reputation Service

export const REPUTATION_RULES = {
    TASK_COMPLETION: {
        points: 5,
        reason: 'Task completed successfully',
    },
    POSITIVE_REVIEW: {
        points: 10,
        reason: 'Received a positive code review',
    },
    OVERDUE_TASK: {
        points: -3,
        reason: 'Task marked overdue',
    },
    BUG_FOUND: {
        points: 15,
        reason: 'Identified critical bug',
    },
    HELPFUL_COMMENT: {
        points: 2,
        reason: 'Provided helpful discussion comment',
    }
};

/**
 * Simulates calculating a new reputation score based on an action
 * 
 * @param {number} currentScore The user's current reputation score
 * @param {keyof typeof REPUTATION_RULES} actionType The type of action performed 
 * @returns {number} The updated score
 */
export const calculateReputationChange = (currentScore, actionType) => {
    const rule = REPUTATION_RULES[actionType];
    if (!rule) return currentScore;

    // Prevent score from dropping below 0
    return Math.max(0, currentScore + rule.points);
};

// Example usage to be integrated into Backend or Frontend context
export const logReputationEvent = (userId, actionType) => {
    const rule = REPUTATION_RULES[actionType];
    if (!rule) return;

    const eventLog = {
        userId,
        pointsAwarded: rule.points,
        reason: rule.reason,
        timestamp: new Date().toISOString()
    };

    console.log(`[Reputation System] Event:`, eventLog);
    return eventLog;
};
