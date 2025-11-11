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
          const { data: requests, error: requestsError } = await supabase
            .from('internal_requests')
            .select(`
              id,
              status,
              request_items(count)
            `)
            .eq('project_id', project.id);

          if (requestsError) throw requestsError;

          const totalProducts = requests?.reduce((sum, req) => {
            return sum + (req.request_items?.[0]?.count || 0);
          }, 0) || 0;

          const pendingRequests = requests?.filter(req => req.status === 'pending').length || 0;

          return {
            project_id: project.id,
            total_products_allocated: totalProducts,
            pending_requests: pendingRequests,
          };
        });

        const stats = await Promise.all(statsPromises);
        return stats;
      }

      const { data: requests, error: requestsError } = await supabase
        .from('internal_requests')
        .select(`
          id,
          status,
          request_items(count)
        `)
        .eq('project_id', projectId);

      if (requestsError) throw requestsError;

      const totalProducts = requests?.reduce((sum, req) => {
        return sum + (req.request_items?.[0]?.count || 0);
      }, 0) || 0;

      const pendingRequests = requests?.filter(req => req.status === 'pending').length || 0;

      return [{
        project_id: projectId,
        total_products_allocated: totalProducts,
        pending_requests: pendingRequests,
      }];
    },
  });
};

export const useProjectRequestItems = (projectId?: string) => {
  return useQuery({
    queryKey: ['project-request-items', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('request_items')
        .select(`
          id,
          quantity_requested,
          created_at,
          product:inventory_items(
            product_name,
            sku
          ),
          request:internal_requests!inner(
            id,
            request_number,
            requester_name,
            status,
            created_at,
            photo_url,
            project_id
          )
        `)
        .eq('request.project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
};
