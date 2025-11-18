import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ClaimWithItems } from '@/lib/supabase';

type ClaimFilters = {
  status?: string;
  projectId?: string;
  claimType?: 'standard' | 'emergency';
  onsiteUserId?: string;
};

export const useClaims = (filters?: ClaimFilters) => {
  return useQuery({
    queryKey: ['claims', filters],
    queryFn: () => api.claims.getAll(filters),
  });
};

export const usePendingClaims = () => {
  return useQuery({
    queryKey: ['claims', 'pending'],
    queryFn: () => api.claims.getPending(),
  });
};

export const useClaim = (claimId?: string) => {
  return useQuery({
    queryKey: ['claim', claimId],
    enabled: !!claimId,
    queryFn: () => api.claims.getById(claimId!),
  });
};

export const useCreateClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      onsiteUserId: string;
      onsiteUserName: string;
      photoUrl: string;
      notes?: string;
      items: Array<{ productId: string; quantity: number }>;
      claimType?: 'standard' | 'emergency';
      emergencyReason?: string | null;
    }) => {
      return api.claims.create({
        projectId: params.projectId,
        onsiteUserId: params.onsiteUserId,
        onsiteUserName: params.onsiteUserName,
        photoUrl: params.photoUrl,
        notes: params.notes,
        items: params.items,
        claimType: params.claimType,
        emergencyReason: params.emergencyReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['claim'] });
    },
  });
};

export const useApproveClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      claimId: string;
      warehouseAdminId: string;
      warehouseAdminName: string;
      approvedQuantities: Record<string, number>;
    }) => {
      return api.claims.approve(params.claimId, params.approvedQuantities);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['projectMaterials'] });
    },
  });
};

export const useDenyClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      claimId: string;
      warehouseAdminId: string;
      warehouseAdminName: string;
      reason?: string;
    }) => {
      return api.claims.deny(params.claimId, params.reason || 'No reason provided', params.reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
  });
};
