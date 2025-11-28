import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ExternalProductsParams {
  size?: number;
  page?: number;
  search?: string;
}

export const useExternalProducts = (params: ExternalProductsParams = {}) =>
  useQuery({
    queryKey: ['external-products', params.size, params.page, params.search ?? ''],
    queryFn: () => api.externalProducts.getAll(params),
    keepPreviousData: true,
  });

