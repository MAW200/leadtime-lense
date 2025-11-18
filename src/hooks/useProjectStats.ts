import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ProjectStats {
  project_id: string;
  total_products_allocated: number;
  pending_requests: number;
}

export const useProjectStats = (projectId?: string) => {
  return useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: async () => {
      // Note: This is a complex query that may need backend support
      // For now, we'll fetch requests and calculate stats
      const requests = await api.requests.getAll();
      const filteredRequests = projectId 
        ? requests.filter((r: any) => r.project_id === projectId)
        : requests;

      if (!projectId) {
        const projects = await api.projects.getAll();
        return projects.map((project: any) => {
          const projectRequests = requests.filter((r: any) => r.project_id === project.id);
          const totalProducts = projectRequests.reduce((sum: number, req: any) => {
            return sum + (req.request_items?.length || 0);
          }, 0);
          const pendingRequests = projectRequests.filter((r: any) => r.status === 'pending').length;

          return {
            project_id: project.id,
            total_products_allocated: totalProducts,
            pending_requests: pendingRequests,
          };
        });
      }

      const totalProducts = filteredRequests.reduce((sum: number, req: any) => {
        return sum + (req.request_items?.length || 0);
      }, 0);
      const pendingRequests = filteredRequests.filter((r: any) => r.status === 'pending').length;

      return [{
        project_id: projectId,
        total_products_allocated: totalProducts,
        pending_requests: pendingRequests,
      }];
    },
  });
};

export type ProjectRequestItem = {
  id: string;
  quantity_requested: number;
  created_at: string;
  product?: {
    product_name: string;
    sku: string;
  } | null;
  request: {
    id: string;
    request_number: string;
    requester_name: string;
    status: 'pending' | 'fulfilled' | 'cancelled';
    created_at: string;
    photo_url: string | null;
    project_id: string;
  };
};

export const useProjectRequestItems = (projectId?: string) => {
  return useQuery({
    queryKey: ['project-request-items', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const requests = await api.requests.getAll();
      const projectRequests = requests.filter((r: any) => r.project_id === projectId);
      
      const items: ProjectRequestItem[] = [];
      for (const req of projectRequests) {
        if (req.request_items) {
          for (const item of req.request_items) {
            items.push({
              id: item.id,
              quantity_requested: item.quantity_requested,
              created_at: item.created_at,
              product: item.product,
              request: {
                id: req.id,
                request_number: req.request_number,
                requester_name: req.requester_name,
                status: req.status,
                created_at: req.created_at,
                photo_url: req.photo_url,
                project_id: req.project_id,
              },
            });
          }
        }
      }
      
      return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!projectId,
  });
};
