import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { InternalRequest, InternalRequestWithItems, RequestItem } from '@/lib/supabase';

export const useInternalRequests = (status?: string) => {
  return useQuery({
    queryKey: ['internal-requests', status],
    queryFn: () => api.requests.getAll(status),
  });
};

export const useInternalRequest = (id?: string) => {
  return useQuery({
    queryKey: ['internal-request', id],
    queryFn: () => api.requests.getById(id!),
    enabled: !!id,
  });
};

export const useCreateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      requester_name: string;
      requester_email?: string;
      destination_property: string;
      notes?: string;
      project_id?: string;
      photo_url?: string;
      created_by_role?: 'admin' | 'onsite_team';
      items: { product_id: string; quantity_requested: number }[];
    }) => {
      return api.requests.create({
        requester_name: request.requester_name,
        requester_email: request.requester_email,
        destination_property: request.destination_property,
        notes: request.notes,
        project_id: request.project_id,
        photo_url: request.photo_url,
        created_by_role: request.created_by_role,
        items: request.items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-requests'] });
    },
  });
};

export const useUpdateRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      fulfilled_date,
    }: {
      id: string;
      status: 'pending' | 'fulfilled' | 'cancelled';
      fulfilled_date?: string;
    }) => {
      return api.requests.updateStatus(id, status, fulfilled_date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['internal-request'] });
    },
  });
};

export const useDeleteRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Note: API doesn't have delete endpoint yet, but keeping structure
      throw new Error('Delete request not implemented in API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-requests'] });
    },
  });
};
