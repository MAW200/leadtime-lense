import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWarehouseMetrics, getStockStatus } from '@/hooks/useDashboardMetrics';
import { Skeleton } from '@/components/ui/skeleton';

export const StockHealthChart = () => {
  const { data, isLoading } = useWarehouseMetrics();

  const chartData = useMemo(() => {
    if (!data || !data.inventory) return [];

    let healthy = 0;
    let low = 0;
    let critical = 0;
    let overstocked = 0;

    data.inventory.forEach(item => {
      const status = getStockStatus(item);
      if (status === 'healthy') healthy++;
      if (status === 'low') low++;
      if (status === 'critical') critical++;
      if (status === 'overstocked') overstocked++;
    });

    return [
      { name: 'Healthy', count: healthy, color: '#22c55e' }, // green-500
      { name: 'Low Stock', count: low, color: '#eab308' }, // yellow-500
      { name: 'Critical', count: critical, color: '#ef4444' }, // red-500
      { name: 'Overstocked', count: overstocked, color: '#3b82f6' }, // blue-500
    ];
  }, [data]);

  if (isLoading) return <Skeleton className="h-[350px] w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Health Distribution</CardTitle>
        <CardDescription>
          Inventory items by status category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                 cursor={{ fill: 'transparent' }}
                 contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

