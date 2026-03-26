const projectService = require('../services/ProjectService');

class ProjectController {
    async getAll(req, res, next) {
        try {
            const projects = await projectService.getAllProjects(req.user.id);
            res.json({ success: true, data: projects });
        } catch (err) {
            next(err);
        }
    }

    async getOne(req, res, next) {
        try {
            const project = await projectService.getProject(req.params.id, req.user.id);
            res.json({ success: true, data: project });
        } catch (err) {
            next(err);
        }
    }

    async create(req, res, next) {
        try {
            const project = await projectService.createProject(req.user.id, req.body);
            res.status(201).json({ success: true, data: project });
        } catch (err) {
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const project = await projectService.updateProject(req.params.id, req.user.id, req.body);
            res.json({ success: true, data: project });
        } catch (err) {
            next(err);
        }
    }

    async delete(req, res, next) {
        try {
            // We await the deletion to catch errors
            await projectService.deleteProject(req.params.id, req.user.id);
            res.json({ success: true, message: 'Project deleted successfully' });
        } catch (err) {
            next(err);
        }
    }

    async addMember(req, res, next) {
        try {
            const projectId = req.params.id;
            const targetUserId = req.body.userId;
            
            const result = await projectService.addMember(projectId, req.user.id, targetUserId);
            
            // Create a notification for the invited user
            const notificationRepo = require('../repositories/NotificationRepository');
            const projectRepo = require('../repositories/ProjectRepository');
            const project = await projectRepo.findById(projectId);
            
            const notifTitle = `Project Invitation`;
            const notifMsg = `${req.user.username} invited you to join #${project.title}.`;
            const notif = await notificationRepo.createNotification(targetUserId, notifTitle, notifMsg);
            
            // Emit via Socket.io specifically to this user's personal channel
            const io = req.app?.get('io');
            if (io) {
                io.to(`user_${targetUserId}`).emit('receiveNotification', notif);
            }
            
            res.status(201).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new ProjectController();
