import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReturnWithItems } from '@/lib/supabase';

export const useReturns = (status?: string) => {
  return useQuery({
    queryKey: ['returns', status],
    queryFn: () => api.returns.getAll(status),
  });
};

export const usePendingReturns = () => {
  return useQuery({
    queryKey: ['returns', 'pending'],
    queryFn: () => api.returns.getPending(),
  });
};

export const useCreateReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      onsiteUserId: string;
      onsiteUserName: string;
      photoUrl: string;
      reason: string;
      notes?: string;
      claimId?: string;
      items: Array<{ productId: string; quantity: number }>;
    }) => {
      return api.returns.create({
        projectId: params.projectId,
        onsiteUserId: params.onsiteUserId,
        onsiteUserName: params.onsiteUserName,
        photoUrl: params.photoUrl,
        reason: params.reason,
        notes: params.notes,
        claimId: params.claimId,
        items: params.items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['returns', 'pending'] });
    },
  });
};

export const useApproveReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      returnId: string;
      warehouseAdminId: string;
      warehouseAdminName: string;
    }) => {
      return api.returns.approve(params.returnId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['returns', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['projectMaterials'] });
    },
  });
};

