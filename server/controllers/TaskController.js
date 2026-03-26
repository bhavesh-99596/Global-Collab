const taskService = require('../services/TaskService');

class TaskController {
    async getAll(req, res, next) {
        try {
            const tasks = await taskService.getAllTasks(req.query.projectId);
            res.json({ success: true, data: tasks });
        } catch (err) {
            next(err);
        }
    }

    async getOne(req, res, next) {
        try {
            const task = await taskService.getTask(req.params.id);
            res.json({ success: true, data: task });
        } catch (err) {
            next(err);
        }
    }

    async create(req, res, next) {
        try {
            const task = await taskService.createTask(req.body);
            res.status(201).json({ success: true, data: task });
        } catch (err) {
            next(err);
        }
    }

    async createBulk(req, res, next) {
        try {
            const insertedTasks = await taskService.createBulkTasks(req.body);
            res.status(201).json({ success: true, data: insertedTasks });
        } catch (err) {
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const task = await taskService.updateTask(req.params.id, req.body);
            res.json({ success: true, data: task });
        } catch (err) {
            next(err);
        }
    }

    async delete(req, res, next) {
        try {
            await taskService.deleteTask(req.params.id);
            res.json({ success: true, message: 'Task deleted successfully' });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new TaskController();
