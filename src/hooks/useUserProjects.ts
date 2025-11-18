import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { UserProject } from '@/lib/supabase';

export const useUserProjects = (userId?: string) => {
  return useQuery({
    queryKey: ['userProjects', userId],
    enabled: !!userId,
    queryFn: () => api.userProjects.getByUser(userId!),
  });
};

export const useAssignUserToProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { userId: string; projectId: string }) => {
      return api.userProjects.assign({
        userId: params.userId,
        projectId: params.projectId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProjects', variables.userId] });
    },
  });
};
