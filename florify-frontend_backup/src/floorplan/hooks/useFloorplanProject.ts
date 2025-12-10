import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { type FloorplanProject, type InsertProject } from "@shared/schema";

// Local storage key
const PROJECTS_KEY = 'floorplan_projects';

// Get projects from localStorage
function getProjectsFromStorage(): FloorplanProject[] {
  try {
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save projects to localStorage
function saveProjectsToStorage(projects: FloorplanProject[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function useFloorplanProjects() {
  return useQuery<FloorplanProject[]>({
    queryKey: ['floorplan-projects'],
    queryFn: () => Promise.resolve(getProjectsFromStorage()),
  });
}

export function useFloorplanProject(id: string | null) {
  return useQuery<FloorplanProject | null>({
    queryKey: ['floorplan-projects', id],
    queryFn: () => {
      if (!id) return Promise.resolve(null);
      const projects = getProjectsFromStorage();
      const project = projects.find(p => p.id === id);
      return Promise.resolve(project || null);
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  return useMutation({
    mutationFn: async (data: InsertProject): Promise<FloorplanProject> => {
      const projects = getProjectsFromStorage();
      const newProject: FloorplanProject = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      projects.push(newProject);
      saveProjectsToStorage(projects);
      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorplan-projects'] });
    },
  });
}

export function useUpdateProject() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FloorplanProject> }): Promise<FloorplanProject> => {
      const projects = getProjectsFromStorage();
      const index = projects.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error('Project not found');
      }
      const updatedProject = {
        ...projects[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      projects[index] = updatedProject;
      saveProjectsToStorage(projects);
      return updatedProject;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['floorplan-projects'] });
      queryClient.invalidateQueries({ queryKey: ['floorplan-projects', variables.id] });
    },
  });
}

export function useDeleteProject() {
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const projects = getProjectsFromStorage();
      const filtered = projects.filter(p => p.id !== id);
      saveProjectsToStorage(filtered);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorplan-projects'] });
    },
  });
}

export function usePrepareExport() {
  return useMutation({
    mutationFn: async (data: { shapes: any[]; options: any }) => {
      // Export is handled client-side, no server needed
      return Promise.resolve(data);
    },
  });
}
