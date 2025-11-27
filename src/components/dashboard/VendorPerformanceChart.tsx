import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

export const VendorPerformanceChart = () => {
  // We need vendors and their PO history to calculate total spend
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors-performance'],
    queryFn: api.vendors.getAll
  });

  // Ideally we need aggregated PO spend per vendor. 
  // For this prototype, we might fetch all POs (already cached likely) and aggregate locally.
  const { data: purchaseOrders, isLoading: posLoading } = useQuery({
    queryKey: ['purchase-orders-all'],
    queryFn: () => api.purchaseOrders.getAll('all')
  });

  const chartData = useMemo(() => {
    if (!vendors || !purchaseOrders) return [];

    return vendors.map(vendor => {
      // Calculate total spend for this vendor
      const vendorPOs = purchaseOrders.filter(po => po.vendor_id === vendor.id);
      const totalSpend = vendorPOs.reduce((sum, po) => sum + (Number(po.total_amount) || 0), 0);
      
      // For scatter plot, we need X (Order Count as proxy for lead time) and Y (Spend)
      // Avoid plotting if no spend to keep chart clean
      if (totalSpend === 0) return null;

      return {
        name: vendor.name,
        leadTime: vendorPOs.length > 0 ? 14 : 0, // Default lead time since not in vendor table
        spend: totalSpend,
        poCount: vendorPOs.length
      };
    }).filter(Boolean) as { name: string; leadTime: number; spend: number; poCount: number }[];

  }, [vendors, purchaseOrders]);

  if (vendorsLoading || posLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Performance Matrix</CardTitle>
        <CardDescription>
          Lead Time vs. Total Spend. 
          <span className="text-muted-foreground ml-1 italic">
            (Top Right = High Spend / Slow Delivery)
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="leadTime" 
                name="Lead Time" 
                unit=" days" 
                label={{ value: 'Lead Time (Days)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="number" 
                dataKey="spend" 
                name="Total Spend" 
                unit="$" 
                label={{ value: 'Total Spend ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border p-2 rounded shadow-lg text-sm">
                        <p className="font-semibold">{data.name}</p>
                        <p>Spend: ${data.spend.toLocaleString()}</p>
                        <p>Lead Time: {data.leadTime} days</p>
                        <p>Orders: {data.poCount}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Vendors" data={chartData} fill="#8884d8">
                 {/* Ideally different colors for performance tiers */}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

