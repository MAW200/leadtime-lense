import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { InventoryItem, Vendor, ProductVendor } from '@/lib/supabase';

export const useInventoryItems = () => {
  return useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => api.inventory.getAll(),
  });
};

export const useVendors = () => {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: () => api.vendors.getAll(),
  });
};

export const useProductVendors = (productId?: string) => {
  return useQuery({
    queryKey: ['product-vendors', productId],
    queryFn: () => api.inventory.getVendors(productId!),
    enabled: productId !== undefined,
  });
};
