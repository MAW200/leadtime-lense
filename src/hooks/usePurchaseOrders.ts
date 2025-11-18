import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PurchaseOrder, PurchaseOrderWithItems, PurchaseOrderItem, InventoryItem } from '@/lib/supabase';

export const usePurchaseOrders = (status?: string) => {
  return useQuery({
    queryKey: ['purchase-orders', status],
    queryFn: () => api.purchaseOrders.getAll(status),
  });
};

export const usePurchaseOrder = (id?: string) => {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => api.purchaseOrders.getById(id!),
    enabled: !!id,
  });
};

export const useVendorProducts = (vendorId?: string) => {
  return useQuery({
    queryKey: ['vendor-products', vendorId],
    queryFn: () => api.vendors.getProducts(vendorId!),
    enabled: !!vendorId,
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (po: {
      vendor_id: string;
      status?: 'draft' | 'sent';
      notes?: string;
      expected_delivery_date?: string;
      created_by?: string;
      items: { product_id: string; quantity: number; unit_price: number }[];
    }) => {
      const totalAmount = po.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );

      return api.purchaseOrders.create({
        vendor_id: po.vendor_id,
        status: po.status || 'draft',
        total_amount: totalAmount,
        order_date: po.status === 'sent' ? new Date().toISOString() : null,
        expected_delivery_date: po.expected_delivery_date,
        notes: po.notes,
        created_by: po.created_by,
        items: po.items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
};

export const useUpdatePurchaseOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'draft' | 'sent' | 'in_transit' | 'received' | 'cancelled';
    }) => {
      const updates: Record<string, string> = { status };

      if (status === 'sent' && !updates.order_date) {
        updates.order_date = new Date().toISOString();
      }

      if (status === 'received') {
        updates.actual_delivery_date = new Date().toISOString();
      }

      return api.purchaseOrders.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
    },
  });
};

export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Note: API doesn't have delete endpoint yet
      throw new Error('Delete purchase order not implemented in API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
};

export const useCompleteQAInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (qaData: {
      po_id: string;
      good_quality_qty: number;
      bad_quality_qty: number;
      qa_photo_url: string;
      qa_completed_by: string;
    }) => {
      return api.purchaseOrders.update(qaData.po_id, {
        good_quality_qty: qaData.good_quality_qty,
        bad_quality_qty: qaData.bad_quality_qty,
        qa_photo_url: qaData.qa_photo_url,
        qa_completed_at: new Date().toISOString(),
        qa_completed_by: qaData.qa_completed_by,
        status: 'received',
        actual_delivery_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
    },
  });
};
