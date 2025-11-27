import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useUserProjects = (userId?: string) => {
  return useQuery({
    queryKey: ['userProjects', userId],
    enabled: !!userId,
    queryFn: () => api.userProjects.getByUser(userId!),
  });
};

export const useProjectUsers = (projectId?: string) => {
  return useQuery({
    queryKey: ['projectUsers', projectId],
    enabled: !!projectId,
    queryFn: () => api.userProjects.getByProject(projectId!),
  });
};

export const useAssignUserToProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { userId: string; projectId: string }) => {
      return api.userProjects.assign({
        user_id: params.userId,
        project_id: params.projectId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProjects', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['projectUsers', variables.projectId] });
    },
  });
};

export const useRemoveUserFromProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { assignmentId: string; userId?: string; projectId?: string }) => {
      await api.userProjects.remove(params.assignmentId);
      return params;
    },
    onSuccess: (params) => {
      if (params.userId) {
        queryClient.invalidateQueries({ queryKey: ['userProjects', params.userId] });
      }
      if (params.projectId) {
        queryClient.invalidateQueries({ queryKey: ['projectUsers', params.projectId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['projectUsers'] });
      }
    },
  });
};
