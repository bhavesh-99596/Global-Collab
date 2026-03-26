const taskRepository = require('../repositories/TaskRepository');
const reputationService = require('../services/reputation.service');

class TaskService {
    async getAllTasks(projectId) {
        return await taskRepository.findAll(projectId);
    }

    async getTask(taskId) {
        const task = await taskRepository.findById(taskId);
        if (!task) {
            const err = new Error('Task not found');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }
        return task;
    }

    async createTask(data) {
        const { title, description, priority, status, deadline, project_id, assignee_id } = data;

        let dbStatus = 'Todo';
        if (status === 'in_progress' || status === 'in progress') dbStatus = 'In Progress';
        if (status === 'review' || status === 'Review') dbStatus = 'Review';
        if (status === 'done' || status === 'Done') dbStatus = 'Done';

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

        return await taskRepository.create(title, description, priority, dbStatus, parsedDeadline, project_id, assignee_id);
    }

    async createBulkTasks(data) {
        const { tasks, projectId } = data;
        if (!tasks || !tasks.length) return [];
        return await taskRepository.createBulk(tasks, projectId, null);
    }

    async updateTask(taskId, data) {
        const { title, description, priority, status, deadline, assignee_id } = data;

        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (title !== undefined) { updateFields.push(`title = $${paramIndex++}`); updateValues.push(title); }
        if (description !== undefined) { updateFields.push(`description = $${paramIndex++}`); updateValues.push(description); }
        if (priority !== undefined) { updateFields.push(`priority = $${paramIndex++}`); updateValues.push(priority); }

        let isCompleting = false;

        if (status !== undefined) {
            let dbStatus = 'Todo';
            if (status === 'todo' || status === 'Todo') dbStatus = 'Todo';
            if (status === 'in_progress' || status === 'in progress') dbStatus = 'In Progress';
            if (status === 'review' || status === 'Review') dbStatus = 'Review';
            if (status === 'done' || status === 'Done') {
                dbStatus = 'Done';
                isCompleting = true;
            }
            updateFields.push(`status = $${paramIndex++}`); updateValues.push(dbStatus);
        }

        if (deadline !== undefined) { 
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
            updateFields.push(`deadline = $${paramIndex++}`); 
            updateValues.push(parsedDeadline); 
        }
        if (assignee_id !== undefined) { updateFields.push(`assigned_user_id = $${paramIndex++}`); updateValues.push(assignee_id); }

        if (updateFields.length === 0) {
            const err = new Error('No fields provided for update');
            err.statusCode = 400;
            err.isOperational = true;
            throw err;
        }

        updateValues.push(taskId);

        const task = await taskRepository.update(taskId, updateFields, updateValues);
        if (!task) {
            const err = new Error('Task not found');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }

        // Trigger reputation events
        if (isCompleting && task.assigned_user_id) {
            // +10 for completing any task
            try { await reputationService.onTaskDone(task.assigned_user_id); } catch (_) {}
            // +15 bonus if task has a 'bug' tag (checking title/description for 'bug' keyword)
            const hasBugTag = (task.title || '').toLowerCase().includes('bug') ||
                              (task.description || '').toLowerCase().includes('bug');
            if (hasBugTag) {
                try { await reputationService.onBugTaskDone(task.assigned_user_id); } catch (_) {}
            }
        }

        return task;
    }

    async deleteTask(taskId) {
        const task = await taskRepository.delete(taskId);
        if (!task) {
            const err = new Error('Task not found');
            err.statusCode = 404;
            err.isOperational = true;
            throw err;
        }
        return task;
    }
}

module.exports = new TaskService();
