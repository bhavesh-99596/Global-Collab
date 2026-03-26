const { OpenAI } = require('openai');
const aiRepository = require('../repositories/AIRepository');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    baseURL: process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-or-') ? 'https://openrouter.ai/api/v1' : undefined,
    defaultHeaders: process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-or-') ? {
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Global Collab Platform"
    } : undefined
});

// Simple in-memory cache for performance optimization (Step 8)
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const getCachedResponse = (key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
};

const setCachedResponse = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
};

class AIService {
    async callOpenAI(prompt, systemInstruction, userId, projectId, actionType) {
        const cacheKey = `${actionType}:${prompt}`;
        const cached = getCachedResponse(cacheKey);

        if (cached) {
            console.log(`[AI Cache Hit] Action: ${actionType}`);
            return cached;
        }

        try {
            // Check if dummy key is used (no actual API key provided)
            if (process.env.OPENAI_API_KEY === 'dummy-key' || !process.env.OPENAI_API_KEY) {
                return { error: "OpenAI API Key is missing. Please add a valid OPENAI_API_KEY to the server .env file." };
            }

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            const parsed = JSON.parse(content);

            if (!parsed || Object.keys(parsed).length === 0) {
                throw new Error("Empty JSON returned from AI");
            }

            setCachedResponse(cacheKey, parsed);

            // Async log to DB using repository
            aiRepository.logInteraction(userId, projectId, prompt, content, actionType).catch(console.error);

            return parsed;
        } catch (error) {
            console.error('[AI Service Error]:', error);
            return { error: error.message || "AI service temporarily unavailable" };
        }
    }

    getMockResponse(actionType, isError = false) {
        if (isError) {
            return { error: "AI service temporarily unavailable" };
        }

        switch (actionType) {
            case 'generate_tasks':
                return {
                    tasks: [
                        { title: "Design database schema", priority: "high", description: "Set up postgres tables." },
                        { title: "Implement authentication system", priority: "high", description: "JWT setup." },
                        { title: "Create dashboard UI", priority: "medium", description: "React frontend components." }
                    ]
                };
            case 'recommend_team':
                return {
                    developers: [
                        { userId: 1, username: "Sarah M.", matchScore: 0.95 },
                        { userId: 2, username: "Alex K.", matchScore: 0.88 }
                    ]
                };
            case 'project_health':
                return {
                    healthScore: 82,
                    status: "Healthy",
                    recommendations: [
                        "Prioritize overdue tasks",
                        "Increase code reviews"
                    ]
                };
            default:
                return { result: "Success" };
        }
    }

    async generateTasks(projectName, description, techStack, deadline, userId, projectId) {
        const systemInstruction = "You are a senior technical project manager aiding in project planning. Answer ONLY with a JSON array list of software development tasks.";
        const prompt = `Generate a list of software development tasks for the following project.
Project Name: ${projectName}
Description: ${description}
Tech Stack: ${techStack}
Deadline: ${deadline}

Return tasks in JSON format:
[
{
"title": "Task name",
"description": "Task description",
"priority": "High/Medium/Low",
"estimated_days": number
}
]`;

        const result = await this.callOpenAI(prompt, systemInstruction, userId, projectId, 'generate_tasks');

        // The AI might return an array directly if it was a JSON response, or it might return it keyed if it followed the previous schema.
        // Wait, the new prompt asks for an array directly! But OpenAIs json_object mode requires the output to be a valid JSON object.
        // If we strictly follow the user's prompt string, let's see. If the user specifies an array at the root, we might need `response_format: { type: "json_object" }` 
        // which forces an object. To be safe, I will capture whatever it returns. The service's `callOpenAI` parses JSON.
        // If `result` is an array from the AI, we'll return it, else we'll extract an array from it.
        let tasksArray = Array.isArray(result) ? result : (result.tasks || Object.values(result)[0]);

        if (result.error || !tasksArray || !Array.isArray(tasksArray)) {
            return result.error ? result : this.getMockResponse('generate_tasks', true);
        }
        return { tasks: tasksArray };
    }

    async recommendTeam(projectDescription, techStack, developersList, userId, projectId) {
        const systemInstruction = "You are an HR technical recruiter. Given a project description, required tech stack, and a list of available developers with their skills, output a JSON object containing a 'developers' array. Each developer must have 'userId', 'username', and a 'matchScore' (0.0 to 1.0) sorted highest to lowest.";
        const prompt = `
Project Description: ${projectDescription}
Required Tech Stack: ${JSON.stringify(techStack)}
Available Developers: ${JSON.stringify(developersList)}
`;

        const result = await this.callOpenAI(prompt, systemInstruction, userId, projectId, 'recommend_team');

        if (result.error || !result.developers || !Array.isArray(result.developers)) {
            return result.error ? result : this.getMockResponse('recommend_team', true);
        }
        return result;
    }

    async checkProjectHealth(projectData, userId, projectId) {
        const systemInstruction = "You are an Agile Delivery Manager. Analyze the provided project data (completed tasks, overdue tasks, team activity, open bugs, deadlines). Output a JSON object with 'healthScore' (0-100), 'status' (Critical, At Risk, Healthy, Excellent), and 'recommendations' (array of strings).";
        const prompt = `Project Data: ${JSON.stringify(projectData)}`;

        const result = await this.callOpenAI(prompt, systemInstruction, userId, projectId, 'project_health');

        if (result.error || typeof result.healthScore !== 'number' || !result.status || !Array.isArray(result.recommendations)) {
            return result.error ? result : this.getMockResponse('project_health', true);
        }
        return result;
    }
}

module.exports = new AIService();
