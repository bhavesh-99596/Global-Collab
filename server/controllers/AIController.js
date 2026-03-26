const aiQueue = require('../workers/aiQueue');
const aiService = require('../services/ai.service');
const db = require('../db'); // Needed temporarily to fetch data. Should be via reps/services.
const taskRepository = require('../repositories/TaskRepository');

class AIController {
    async generateTasks(req, res, next) {
        try {
            const { projectName, description, techStack, deadline, projectId } = req.body;
            const userId = req.user.id;

            if (!projectName || !description) {
                const err = new Error('projectName and description are required');
                err.statusCode = 400;
                err.isOperational = true;
                throw err;
            }

            // Call AI Service synchronously
            const aiResponse = await aiService.generateTasks(projectName, description, techStack, deadline, userId, projectId);

            if (aiResponse.error) {
                const err = new Error(aiResponse.error);
                err.statusCode = 503;
                err.isOperational = true;
                throw err;
            }

            // Do not insert tasks automatically anymore. Just return the generated ones so the user can select.
            const generatedTasks = aiResponse.tasks;
            
            // Still format the deadlines for the frontend preview
            const formattedTasks = generatedTasks.map(task => {
                let taskDeadline = new Date();
                if (task.estimated_days) {
                    taskDeadline.setDate(taskDeadline.getDate() + task.estimated_days);
                } else if (deadline) {
                    taskDeadline = new Date(deadline);
                } else {
                    taskDeadline.setDate(taskDeadline.getDate() + 7);
                }
                return {
                    ...task,
                    deadline: taskDeadline.toISOString(),
                    status: 'Todo',
                    priority: task.priority ? task.priority.toLowerCase() : 'medium'
                };
            });

            res.status(200).json({
                success: true,
                data: formattedTasks,
                message: 'Tasks generated successfully.'
            });
        } catch (err) {
            next(err);
        }
    }

    async recommendTeam(req, res, next) {
        try {
            const { projectDescription, techStack, projectId } = req.body;
            const userId = req.user.id;

            let developersList = [];
            try {
                // Should ideally move to UserRepository/UserService
                const usersResult = await db.query('SELECT id as "userId", username, skills, reputation FROM users WHERE id != $1 LIMIT 50', [userId]);
                developersList = usersResult.rows.map(u => ({
                    userId: u.userId,
                    username: u.username,
                    skills: u.skills || [],
                    reputation: u.reputation
                }));
            } catch (dbErr) {
                console.warn('Could not fetch developers for AI context', dbErr);
            }

            const aiResponse = await aiService.recommendTeam(projectDescription, techStack || [], developersList, userId, projectId);

            if (aiResponse.error) {
                const err = new Error(aiResponse.error);
                err.statusCode = 503;
                err.isOperational = true;
                throw err;
            }

            res.json({ success: true, data: aiResponse.developers || [] });
        } catch (err) {
            next(err);
        }
    }

    async getProjectHealth(req, res, next) {
        try {
            const { projectId } = req.params;
            const userId = req.user.id;

            // Gather metrics for the project - should move to Project/Task Service later ideally
            const tasksResult = await db.query('SELECT status, priority, deadline FROM tasks WHERE project_id = $1', [projectId]);
            const tasks = tasksResult.rows;

            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'Done').length;
            const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done' && t.status !== 'Done').length;

            let recentActivityCount = 0;
            try {
                const actRes = await db.query('SELECT COUNT(*) FROM activity_feed WHERE project_id = $1 AND created_at >= NOW() - INTERVAL \'7 days\'', [projectId]);
                recentActivityCount = parseInt(actRes.rows[0].count, 10);
            } catch (e) { }

            const projectData = {
                totalTasks,
                completedTasks,
                overdueTasks,
                recentActivityCount
            };

            const aiResponse = await aiService.checkProjectHealth(projectData, userId, projectId);

            if (aiResponse.error) {
                const err = new Error(aiResponse.error);
                err.statusCode = 503;
                err.isOperational = true;
                throw err;
            }

            res.json({ success: true, data: aiResponse });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AIController();
