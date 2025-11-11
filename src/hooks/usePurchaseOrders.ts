import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, PurchaseOrder, PurchaseOrderWithItems, PurchaseOrderItem, InventoryItem } from '@/lib/supabase';

export const usePurchaseOrders = (status?: string) => {
  return useQuery({
    queryKey: ['purchase-orders', status],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          vendor:vendors(*),
          purchase_order_items(
            *,
            product:inventory_items(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PurchaseOrderWithItems[];
    },
  });
};

export const usePurchaseOrder = (id?: string) => {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendor:vendors(*),
          purchase_order_items(
            *,
            product:inventory_items(*)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as PurchaseOrderWithItems | null;
    },
    enabled: !!id,
  });
};

export const useVendorProducts = (vendorId?: string) => {
  return useQuery({
    queryKey: ['vendor-products', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];

      const { data, error } = await supabase
        .from('product_vendors')
        .select(`
          product:inventory_items(*)
        `)
        .eq('vendor_id', vendorId);

      if (error) throw error;
      return data.map(item => item.product).filter(Boolean) as InventoryItem[];
    },
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
      const { data: poNumber } = await supabase.rpc('generate_po_number');

      const totalAmount = po.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );

      const { data: newPO, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          vendor_id: po.vendor_id,
          status: po.status || 'draft',
          total_amount: totalAmount,
          order_date: po.status === 'sent' ? new Date().toISOString() : null,
          expected_delivery_date: po.expected_delivery_date,
          notes: po.notes,
          created_by: po.created_by,
        })
        .select()
        .single();

      if (poError) throw poError;

      const poItems = po.items.map((item) => ({
        po_id: newPO.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItems);

      if (itemsError) throw itemsError;

      return newPO;
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

      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          good_quality_qty: qaData.good_quality_qty,
          bad_quality_qty: qaData.bad_quality_qty,
          qa_photo_url: qaData.qa_photo_url,
          qa_completed_at: new Date().toISOString(),
          qa_completed_by: qaData.qa_completed_by,
          status: 'received',
          actual_delivery_date: new Date().toISOString(),
        })
        .eq('id', qaData.po_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
    },
  });
};
