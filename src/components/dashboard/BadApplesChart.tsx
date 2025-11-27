import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

export const BadApplesChart = () => {
  const { data: adjustments, isLoading } = useQuery({
    queryKey: ['negative-adjustments'],
    queryFn: () => api.stockAdjustments.getAll({ reason: 'Damage' }) // Or filter on client
  });

  const chartData = useMemo(() => {
    if (!adjustments) return [];

    // Group by Product and Sum Negative Quantity
    const lossMap = new Map<string, number>();

    adjustments.forEach(adj => {
        if (adj.quantity_change < 0) {
            const productName = adj.product?.product_name || 'Unknown Product';
            // Use absolute value for chart
            const loss = Math.abs(adj.quantity_change);
            lossMap.set(productName, (lossMap.get(productName) || 0) + loss);
        }
    });

    // Convert to array, sort by loss descending, take top 5
    return Array.from(lossMap.entries())
        .map(([name, count]) => ({ name: name.substring(0, 15) + (name.length>15?'...':''), full_name: name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

  }, [adjustments]);

  if (isLoading) return <Skeleton className="h-[350px] w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>The "Bad Apples"</CardTitle>
        <CardDescription>Top products with negative adjustments (Damage/Loss)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))' }}
              />
              <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: 'gray', fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

