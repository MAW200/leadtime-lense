import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { StockAdjustment } from '@/lib/supabase';

export const useStockAdjustments = (filters?: { reason?: string; startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['stock-adjustments', filters],
    queryFn: () => api.stockAdjustments.getAll(filters),
  });
};

export const useCreateStockAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productId: string;
      quantityChange: number;
      reason: string;
      notes?: string;
      adminId: string;
      adminName: string;
    }) => {
      return api.stockAdjustments.create({
        product_id: params.productId,
        quantity_change: params.quantityChange,
        reason: params.reason,
        notes: params.notes,
        admin_id: params.adminId,
        admin_name: params.adminName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });
};

