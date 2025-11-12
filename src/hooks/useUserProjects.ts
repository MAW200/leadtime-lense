import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserProject } from '@/lib/supabase';

export const useUserProjects = (userId?: string) => {
  return useQuery({
    queryKey: ['userProjects', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_projects')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProject[];
    },
  });
};

export const useAssignUserToProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { userId: string; projectId: string }) => {
      const { data, error } = await supabase
        .from('user_projects')
        .insert({
          user_id: params.userId,
          project_id: params.projectId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProjects', variables.userId] });
    },
  });
};
