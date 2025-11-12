import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProjectMaterial } from '@/lib/supabase';

export const useProjectMaterials = (projectId?: string) => {
  return useQuery({
    queryKey: ['projectMaterials', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_materials')
        .select(`
          *,
          product:inventory_items(*)
        `)
        .eq('project_id', projectId)
        .order('phase', { ascending: true });

      if (error) throw error;
      return data as ProjectMaterial[];
    },
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
      const { data, error } = await supabase
        .from('project_materials')
        .insert({
          project_id: params.projectId,
          product_id: params.productId,
          phase: params.phase,
          required_quantity: params.requiredQuantity,
          claimed_quantity: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectMaterials', variables.projectId] });
    },
  });
};
