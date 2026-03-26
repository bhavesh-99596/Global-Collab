const EventEmitter = require('events');
const aiService = require('../services/ai.service');
const db = require('../db');
const logger = require('../utils/logger');

class AiJobQueue extends EventEmitter {
    constructor() {
        super();
        this.on('generateTasks', this.processGenerateTasks.bind(this));
    }

    // Producer Function
    enqueueGenerateTasks(projectDescription, userId, projectId) {
        // We accept the job and fire immediately, but don't force the HTTP request to wait on this.
        this.emit('generateTasks', { projectDescription, userId, projectId });
    }

    // Consumer Function
    async processGenerateTasks({ projectDescription, userId, projectId }) {
        try {
            logger.info(`[AI_QUEUE] Started async task generation for Project ${projectId}`);

            const aiResponse = await aiService.generateTasks(projectDescription, userId, projectId);

            if (aiResponse.error) {
                logger.error(`[AI_QUEUE] Error generating tasks: ${aiResponse.error}`);
                return;
            }

            const tasks = aiResponse.tasks || [];

            if (projectId && tasks.length > 0) {
                for (const task of tasks) {
                    const query = `
                        INSERT INTO tasks (title, description, priority, project_id, status)
                        VALUES ($1, $2, $3, $4, $5)
                    `;
                    const values = [task.title, task.description || '', task.priority, projectId, 'todo'];
                    await db.query(query, values);
                }
                logger.info(`[AI_QUEUE] Successfully generated and stored ${tasks.length} tasks for Project ${projectId}`);
            }
        } catch (err) {
            logger.error(`[AI_QUEUE] Unhandled exception in processGenerateTasks:`, err);
        }
    }
}

module.exports = new AiJobQueue();
