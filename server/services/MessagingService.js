const messagingRepository = require('../repositories/MessagingRepository');

class MessagingService {
    async getConversationHistory(currentUserId, otherUserId) {
        return await messagingRepository.getConversation(currentUserId, otherUserId);
    }

    async sendMessage(senderId, receiverId, content, attachment = null) {
        if (!receiverId || (!content && !attachment)) {
            const err = new Error('Receiver ID and content/attachment are required');
            err.statusCode = 400;
            err.isOperational = true;
            throw err;
        }

        let attachUrl = attachment?.url || null;
        let attachName = attachment?.name || null;
        let attachType = attachment?.type || null;

        return await messagingRepository.createMessage(senderId, receiverId, content || '', attachUrl, attachName, attachType);
    }

    async getProjectMessages(projectId) {
        return await messagingRepository.getProjectMessages(projectId);
    }

    async sendProjectMessage(senderId, projectId, content, attachment = null) {
        if (!projectId || (!content && !attachment)) {
            const err = new Error('Project ID and content/attachment are required');
            err.statusCode = 400;
            err.isOperational = true;
            throw err;
        }

        let attachUrl = attachment?.url || null;
        let attachName = attachment?.name || null;
        let attachType = attachment?.type || null;

        return await messagingRepository.createProjectMessage(senderId, projectId, content || '', attachUrl, attachName, attachType);
    }
}

module.exports = new MessagingService();
