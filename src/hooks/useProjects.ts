import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Project } from '@/lib/supabase';

export const useProjects = (statusFilter?: string) => {
  return useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: () => api.projects.getAll(statusFilter),
  });
};

export const useProject = (id?: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => api.projects.getById(id!),
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: {
      name: string;
      location?: string;
      status?: 'active' | 'completed' | 'on_hold';
      description?: string;
    }) => {
      return api.projects.create({
        name: project.name,
        location: project.location,
        status: project.status || 'active',
        description: project.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      location?: string;
      status?: 'active' | 'completed' | 'on_hold';
      description?: string;
    }) => {
      return api.projects.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.projects.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
