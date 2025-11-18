import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ProjectStats {
  project_id: string;
  total_products_allocated: number;
  pending_requests: number;
}

export const useProjectStats = (projectId?: string) => {
  return useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: async () => {
      if (!projectId) {
        const { data: allProjects, error: projectsError } = await supabase
          .from('projects')
          .select('id');

        if (projectsError) throw projectsError;

        const statsPromises = allProjects.map(async (project) => {
          // Count pending claims for this project
          const { data: claims, error: claimsError } = await supabase
            .from('claims')
            .select('id, status')
            .eq('project_id', project.id)
            .eq('status', 'pending');

          if (claimsError) throw claimsError;

          // Count total products allocated from project_materials
          const { data: materials, error: materialsError } = await supabase
            .from('project_materials')
            .select('required_quantity')
            .eq('project_id', project.id);

          if (materialsError) throw materialsError;

          const totalProducts = materials?.reduce((sum, mat) => {
            return sum + (mat.required_quantity || 0);
          }, 0) || 0;

          const pendingRequests = claims?.length || 0;

          return {
            project_id: project.id,
            total_products_allocated: totalProducts,
            pending_requests: pendingRequests,
          };
        });

        const stats = await Promise.all(statsPromises);
        return stats;
      }

      // Count pending claims for this project
      const { data: claims, error: claimsError } = await supabase
        .from('claims')
        .select('id, status')
        .eq('project_id', projectId)
        .eq('status', 'pending');

      if (claimsError) throw claimsError;

      // Count total products allocated from project_materials
      const { data: materials, error: materialsError } = await supabase
        .from('project_materials')
        .select('required_quantity')
        .eq('project_id', projectId);

      if (materialsError) throw materialsError;

      const totalProducts = materials?.reduce((sum, mat) => {
        return sum + (mat.required_quantity || 0);
      }, 0) || 0;

      const pendingRequests = claims?.length || 0;

      return [{
        project_id: projectId,
        total_products_allocated: totalProducts,
        pending_requests: pendingRequests,
      }];
    },
  });
};
