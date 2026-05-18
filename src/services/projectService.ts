import { Project } from '../types/workspace';

const PROJECTS_KEY = 'workspace_projects';

const db = {
  getProjects: (): Project[] => JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]'),
  saveProjects: (projects: Project[]) => localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)),
};

class ProjectService {
  async getProjectsByGroup(groupId: string): Promise<Project[]> {
    return Promise.resolve(db.getProjects().filter(p => p.group_id === groupId));
  }

  async getProjectById(projectId: string): Promise<Project | undefined> {
    return Promise.resolve(db.getProjects().find(p => p.project_id === projectId));
  }

  async createProject(projectData: Partial<Project> & { group_id: string }): Promise<Project> {
    const projects = db.getProjects();
    const newProject: Project = {
      project_id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      group_id: projectData.group_id,
      project_name: projectData.project_name || 'New Project',
      project_type: projectData.project_type || 'canvas',
      description: projectData.description || '',
      canvas_ids: projectData.canvas_ids || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    projects.push(newProject);
    db.saveProjects(projects);
    return Promise.resolve(newProject);
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    const projects = db.getProjects();
    const index = projects.findIndex(p => p.project_id === projectId);
    if (index === -1) return Promise.resolve(null);
    projects[index] = { ...projects[index], ...updates, updated_at: new Date().toISOString() };
    db.saveProjects(projects);
    return Promise.resolve(projects[index]);
  }
}

export const projectService = new ProjectService();
