import { useQuery } from '@tanstack/react-query';
import { supabase, InventoryItem, Vendor, ProductVendor } from '@/lib/supabase';

export const useInventoryItems = () => {
  return useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('product_name', { ascending: true });

      if (error) throw error;
      return data as InventoryItem[];
    },
  });
};

export const useVendors = () => {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Vendor[];
    },
  });
};

export const useProductVendors = (productId?: string) => {
  return useQuery({
    queryKey: ['product-vendors', productId],
    queryFn: async () => {
      let query = supabase
        .from('product_vendors')
        .select(`
          *,
          vendor:vendors(*),
          product:inventory_items(*)
        `);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query.order('is_primary', { ascending: false });

      if (error) throw error;
      return data as ProductVendor[];
    },
    enabled: productId !== undefined,
  });
};
