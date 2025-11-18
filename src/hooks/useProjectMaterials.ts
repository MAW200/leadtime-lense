import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProjectMaterial } from '@/lib/supabase';

export const useProjectMaterials = (projectId?: string) => {
  return useQuery({
    queryKey: ['projectMaterials', projectId],
    enabled: !!projectId,
    queryFn: () => api.projects.getMaterials(projectId!),
  });
};

export const useCreateProjectMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      productId: string;
      phase: 'P1' | 'P2a' | 'P2b';
      requiredQuantity: number;
    }) => {
      return api.projectMaterials.create({
        projectId: params.projectId,
        productId: params.productId,
        phase: params.phase,
        requiredQuantity: params.requiredQuantity,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectMaterials', variables.projectId] });
    },
  });
};
