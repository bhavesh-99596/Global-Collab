const subscriptionRepository = require('../repositories/SubscriptionRepository');
const projectRepo = require('../repositories/ProjectRepository');

class SubscriptionService {
    async getPlans() {
        return await subscriptionRepository.getPlans();
    }

    async getSubscription(userId) {
        let sub = await subscriptionRepository.getSubscriptionByUserId(userId);
        if (!sub) {
            // Default to free if no record exists yet
            await subscriptionRepository.createOrUpdateSubscription(userId, 'free', 'active');
            sub = await subscriptionRepository.getSubscriptionByUserId(userId);
        }
        
        // Calculate Usage Quotas dynamically
        const projects = await projectRepo.findAllByOwnerId(userId);
        
        // Return full quota mapping
        sub.usage = {
            projects: projects.length,
            project_limit: sub.project_limit,
            members: 1, // Optional: if implementing member queries
            member_limit: sub.member_limit,
            ai: 0, // Mock for now or query AI logs
            ai_limit: sub.ai_limit,
            storage: 0, // Mock for now
            storage_limit: sub.storage_limit
        };

        return sub;
    }

    async upgradeSubscription(userId, planId) {
        return await subscriptionRepository.createOrUpdateSubscription(userId, planId, 'active');
    }
}

module.exports = new SubscriptionService();
