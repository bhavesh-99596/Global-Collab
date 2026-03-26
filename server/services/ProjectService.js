const projectRepository = require('../repositories/ProjectRepository');
const activityService = require('../services/ActivityService');
const reputationService = require('./reputation.service');

class ProjectService {
    async getAllProjects(userId) {
        return await projectRepository.findAllByOwnerId(userId);
    }

    async getProject(projectId, userId) {
        const project = await projectRepository.findByIdAndOwner(projectId, userId);
        if (!project) {
            const err = new Error('Project not found or unauthorized');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }
        return project;
    }

    async createProject(userId, data) {
        const { title, description, tech, deadline } = data;
        const techArray = typeof tech === 'string' ? tech.split(',').map(s => s.trim()) : (tech || []);

        // Robust date parsing (handle DD-MM-YYYY and YYYY-MM-DD)
        let parsedDeadline = null;
        if (deadline) {
            const parts = deadline.split('-');
            if (parts.length === 3) {
                if (parts[0].length === 4) { // YYYY-MM-DD
                    parsedDeadline = deadline;
                } else if (parts[2].length === 4) { // DD-MM-YYYY
                    parsedDeadline = `${parts[2]}-${parts[1]}-${parts[0]}`;
                } else {
                    parsedDeadline = deadline;
                }
            } else {
                parsedDeadline = deadline;
            }
        }

        const project = await projectRepository.create(title, description, techArray, parsedDeadline, userId);

        // Fire activity log
        await activityService.logActivity(
            'project_created',
            `Created new project: ${title}`,
            project.id,
            userId
        );

        // Reputation: +20 for creating a project
        try { await reputationService.onCreateProject(userId); } catch (_) {}

        return project;
    }

    async updateProject(projectId, userId, data) {
        const { title, description, tech, deadline } = data;
        const techArray = typeof tech === 'string' ? tech.split(',').map(s => s.trim()) : (tech || []);

        // Robust date parsing (handle DD-MM-YYYY and YYYY-MM-DD)
        let parsedDeadline = null;
        if (deadline) {
            const parts = String(deadline).split('-');
            if (parts.length === 3) {
                if (parts[0].length === 4) { // YYYY-MM-DD
                    parsedDeadline = deadline;
                } else if (parts[2].length === 4) { // DD-MM-YYYY
                    parsedDeadline = `${parts[2]}-${parts[1]}-${parts[0]}`;
                } else {
                    parsedDeadline = deadline;
                }
            } else {
                parsedDeadline = deadline;
            }
        }

        const project = await projectRepository.update(projectId, userId, title, description, techArray, parsedDeadline);
        if (!project) {
            const err = new Error('Project not found or unauthorized');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }

        // Reputation: +50 for completing a project
        if (data.status && data.status.toLowerCase() === 'completed') {
            try { await reputationService.onCompleteProject(userId); } catch (_) {}
        }

        return project;
    }

    async deleteProject(projectId, userId) {
        const project = await projectRepository.delete(projectId, userId);
        if (!project) {
            const err = new Error('Project not found or unauthorized');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }
        return project;
    }
    
    async addMember(projectId, ownerId, userId) {
        // Validate ownership
        const project = await projectRepository.findByIdAndOwner(projectId, ownerId);
        if (!project) {
            const err = new Error('Project not found or unauthorized');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }
        return await projectRepository.addMember(projectId, userId);
    }
}

module.exports = new ProjectService();
