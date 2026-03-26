/**
 * GlobalCollab AI Service Structure
 * Module 5: AI Integration Foundation
 */

import { api } from './api';

export const aiService = {
  /**
   * Generates technical tasks based on a project prompt via backend Queue.
   * Resolves with a 202 status message while the backend processes it.
   */
  async generateTasks(prompt, projectId = 1) {
    try {
      console.log("Requesting task generation for:", prompt);
      const response = await api.post('/ai/generate-tasks', {
        projectDescription: prompt,
        projectId: projectId
      });
      return response; // usually { success: true, message: 'Task generation started...' }
    } catch (error) {
      console.error('AI Task Generation Error:', error);
      throw new Error('Failed to dispatch AI generation job');
    }
  },

  /**
   * Recommends team members based on project requirements via synchronous API.
   */
  async recommendTeam(prompt, availableDevelopers, projectId = null) {
    try {
      console.log("Requesting team recommendation for:", prompt);
      const response = await api.post('/ai/recommend-team', {
        projectDescription: prompt,
        techStack: [],
        projectId: projectId
      });

      return response.data; // returns array of developers matched
    } catch (error) {
      console.error('AI Team Recommendation Error:', error);
      throw new Error('Failed to recommend team from API');
    }
  }
};
