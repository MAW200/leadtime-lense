import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { InventoryItem } from '@/lib/supabase';

// --- Helper Types ---
export type StockStatus = 'critical' | 'low' | 'healthy' | 'overstocked';

// --- Helper Logic ---

/**
 * Determines the status of a stock item based on inventory levels.
 * Critical: In stock < Allocated (Immediate shortage)
 * Low: In stock < Safety Stock (Restock needed soon)
 * Overstocked: In stock > (Allocated + Safety Stock * 2) (Too much capital tied up)
 * Healthy: Everything else
 */
export const getStockStatus = (item: InventoryItem): StockStatus => {
  if (item.in_stock < item.allocated) return 'critical';
  if (item.in_stock < item.safety_stock) return 'low';
  
  // Example overstock logic: If we have more than allocated + 2x safety stock
  // This can be tuned based on business rules
  const maxOptimalStock = item.allocated + (item.safety_stock * 2);
  if (item.in_stock > maxOptimalStock && maxOptimalStock > 0) return 'overstocked';
  
  return 'healthy';
};

// --- Hooks ---

/**
 * Aggregates high-level executive metrics.
 * - Inventory Value
 * - Capital Committed (POs)
 * - System Leakage (Losses)
 */
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      // 1. Fetch core data concurrently
      const [inventory, pos, stockAdjustments] = await Promise.all([
        api.inventory.getAll(),
        api.purchaseOrders.getAll('all'), // Fetch all to filter locally for now
        api.stockAdjustments.getAll() // Fetch all to filter locally
      ]);

      // 2. Calculate Inventory Value
      const totalInventoryValue = inventory.reduce((sum, item) => {
        return sum + (item.in_stock * (Number(item.unit_cost) || 0));
      }, 0);

      // 3. Calculate Capital Committed (Draft + Sent POs)
      const capitalCommitted = pos
        .filter(po => po.status === 'draft' || po.status === 'sent')
        .reduce((sum, po) => sum + (Number(po.total_amount) || 0), 0);

      // 4. Calculate System Leakage (Loss/Damage from Stock Adjustments)
      // Looking for negative adjustments with reasons like 'Damage', 'Lost', 'Theft'
      const systemLeakage = stockAdjustments
        .filter(adj => 
          adj.quantity_change < 0 && 
          ['damage', 'lost', 'theft', 'expired'].some(r => adj.reason.toLowerCase().includes(r))
        )
        .reduce((sum, adj) => sum + (Math.abs(adj.quantity_change) * (adj.product?.unit_cost || 0)), 0);
        // Note: Accurate leakage value requires joining with product cost. 
        // For now, we might need to fetch products if cost isn't in the adjustment, 
        // but `api.stockAdjustments.getAll` includes `product:inventory_items(*)` so we can use product.unit_cost.

      return {
        totalInventoryValue,
        capitalCommitted,
        systemLeakage,
        rawInventory: inventory, // Return raw data for other components to use if needed avoiding refetch
      };
    }
  });
};

/**
 * Aggregates data for the "Project Burn Rate" chart.
 * Compares Material Usage (Claims) vs. Restocking (POs) over time.
 */
export const useProjectBurnRate = () => {
  return useQuery({
    queryKey: ['project-burn-rate'],
    queryFn: async () => {
      const [claims, pos] = await Promise.all([
        api.claims.getAll(), // We need all claims to sum values
        api.purchaseOrders.getAll('all')
      ]);

      // Group by Month (or Week)
      const timeMap = new Map<string, { claims: number; pos: number }>();

      // Helper to get YYYY-MM key
      const getKey = (dateStr: string) => dateStr.substring(0, 7); 

      // Process Claims (Money Out / Value Consumed)
      // Note: Claims don't store "value", they store items. 
      // Realistically we need to calculate value based on item costs.
      // For this sprint, we might rely on a "estimated value" or we need to fetch claim items with costs.
      // api.claims.getAll includes items? Check api.ts.
      // api.claims.getAll returns Claim[] which doesn't have items nested by default in the type definition usually,
      // but the Supabase query might include it. 
      // Let's assume for accuracy we might need a more specific query or we estimate based on average.
      // *Correction*: To be accurate, we need to fetch claim items or just use counts if value is too heavy.
      // Let's try to map it to a value if possible, otherwise we count volume.
      // For the "Flow of Value" story, money is key. 
      // *Strategy*: We will use a simplified "Activity Volume" if cost is missing, but let's check `api.claims.getAll`.
      // It selects `*, project:projects(*)`. It does NOT select items.
      // We might need a specific analytics query. For now, let's mock the value aggregation or separate it.
      
      // *Revised Strategy for Sprint 1*: 
      // We will return the raw collections sorted by date so the UI can transform them,
      // or basic counts. For "Value", we'd ideally need a backend function or a join.
      // Let's return the raw datasets for the Chart component to process.
      
      return {
        claims,
        purchaseOrders: pos
      };
    }
  });
};

/**
 * Aggregates Warehouse Metrics
 * - Stockouts
 * - Inbound
 */
export const useWarehouseMetrics = () => {
  return useQuery({
    queryKey: ['warehouse-metrics'],
    queryFn: async () => {
      const [inventory, pos, claims] = await Promise.all([
        api.inventory.getAll(),
        api.purchaseOrders.getAll('all'),
        api.claims.getPending()
      ]);

      // Stockouts (Critical)
      const stockouts = inventory.filter(item => item.in_stock < item.allocated).length;

      // Inbound Today
      const today = new Date().toISOString().split('T')[0];
      const inboundToday = pos.filter(po => 
        po.expected_delivery_date && 
        po.expected_delivery_date.split('T')[0] === today &&
        po.status !== 'received' && 
        po.status !== 'cancelled'
      ).length;

      // Pending Claims
      const pendingClaimsCount = claims.length;

      return {
        stockouts,
        inboundToday,
        pendingClaimsCount,
        inventory // useful for distribution charts
      };
    }
  });
};

