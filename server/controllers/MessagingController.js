const messagingService = require('../services/MessagingService');
const reputationService = require('../services/reputation.service');

class MessagingController {
    async getMessages(req, res, next) {
        try {
            const currentUserId = req.user.id; // From auth middleware
            const otherUserId = req.params.userId;

            const messages = await messagingService.getConversationHistory(currentUserId, otherUserId);

            res.json({
                success: true,
                data: messages
            });
        } catch (err) {
            next(err);
        }
    }

    async sendMessage(req, res, next) {
        try {
            const senderId = req.user.id; // From auth middleware
            const { receiverId, content, attachment } = req.body;

            const newMessage = await messagingService.sendMessage(senderId, receiverId, content, attachment);
            
            // Notification Logic
            const notifRepo = require('../repositories/NotificationRepository');
            const notif = await notifRepo.createNotification(
                receiverId, 
                `New message from ${req.user.username || 'Someone'}`, 
                `${content || 'Attachment sent'}`
            );

            const io = req.app?.get('io');
            if (io) {
                io.to(`user_${receiverId}`).emit('receiveNotification', notif);
            }

            // Reputation: +2 for sending a message
            try { await reputationService.onMessage(senderId); } catch (_) {}

            res.status(201).json({
                success: true,
                data: newMessage
            });
        } catch (err) {
            next(err);
        }
    }

    async getProjectMessages(req, res, next) {
        try {
            const projectId = req.params.projectId;
            const messages = await messagingService.getProjectMessages(projectId);
            res.json({ success: true, data: messages });
        } catch (err) {
            next(err);
        }
    }

    async sendProjectMessage(req, res, next) {
        try {
            const senderId = req.user.id;
            const projectId = req.params.projectId;
            const { content, attachment } = req.body;

            const newMessage = await messagingService.sendProjectMessage(senderId, projectId, content, attachment);

            // 1. Emit Socket Event
            const io = req.app?.get('io');
            if (io) {
                io.to(`project_${projectId}`).emit('receiveMessage', newMessage);
            }

            // 2. Notifications, Emails, Push
            try {
                const projectRepo = require('../repositories/ProjectRepository');
                const members = await projectRepo.getProjectMembers(projectId);
                const project = await projectRepo.findById(projectId);
                
                const emailService = require('../services/EmailService');
                const pushService = require('../services/PushService');
                const notifRepo = require('../repositories/NotificationRepository');
                const userRepo = require('../repositories/UserRepository');

                const otherMembers = members.filter(m => m.user_id !== senderId);
                const userIdsStrings = [];
                
                for (let member of otherMembers) {
                    userIdsStrings.push(member.user_id.toString());
                    
                    // In-App Notification
                    const notif = await notifRepo.createNotification(
                        member.user_id, 
                        `New message in ${project?.title || 'Project'}`, 
                        `${req.user.username || 'Someone'}: ${content || 'Attachment sent'}`
                    );

                    const io = req.app?.get('io');
                    if (io) {
                        io.to(`user_${member.user_id}`).emit('receiveNotification', notif);
                    }

                    // Email Notification
                    const user = await userRepo.findById(member.user_id);
                    if (user && user.email) {
                        await emailService.sendNotificationEmail(
                            user.email,
                            'New Message in Project',
                            `You have received a new message in your project ${project?.title || 'Project'}:\n\n${req.user.username || 'Someone'}: ${content}`
                        );
                    }
                }

                // Push Notification (batch)
                if (userIdsStrings.length > 0) {
                    await pushService.sendPushNotification(
                        userIdsStrings, 
                        `New message in ${project?.title || 'Project'}`, 
                        `${req.user.username || 'Someone'}: ${content}`
                    );
                }
            } catch (notifyErr) {
                console.error("Error sending notifications:", notifyErr);
            }

            // Reputation: +2 for sending a project message
            try { await reputationService.onMessage(senderId); } catch (_) {}

            res.status(201).json({ success: true, data: newMessage });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new MessagingController();
