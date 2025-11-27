import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api'; // Assuming we use auditLogs or Claims for traffic
import { Skeleton } from '@/components/ui/skeleton';

// Heatmap logic: Day of Week (X) vs Hour of Day (Y) vs Count (Z/Color)
export const WarehouseTrafficChart = () => {
  // Using AuditLogs to track "Claim Approved" or "Claim Created" timestamps
  const { data: logs, isLoading } = useQuery({
    queryKey: ['traffic-logs'],
    queryFn: () => api.auditLogs.getAll({ actionType: 'claim_created' }) // Filter if possible or client side
  });

  const chartData = useMemo(() => {
    if (!logs) return [];

    // Initialize grid: 7 days x 24 hours
    const grid = new Map<string, number>();
    
    logs.forEach(log => {
       // Mocking timestamps if necessary or using real ones
       const date = new Date(log.timestamp);
       const day = date.getDay(); // 0 (Sun) - 6 (Sat)
       const hour = date.getHours(); // 0 - 23
       
       const key = `${day}-${hour}`;
       grid.set(key, (grid.get(key) || 0) + 1);
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = [];

    for (let d = 0; d < 7; d++) {
      for (let h = 8; h <= 18; h++) { // Focus on work hours 8am - 6pm for better visual
         const count = grid.get(`${d}-${h}`) || 0;
         data.push({
            dayIndex: d,
            day: days[d],
            hour: h,
            value: count
         });
      }
    }

    return data;
  }, [logs]);

  if (isLoading) return <Skeleton className="h-[350px] w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouse Traffic Heatmap</CardTitle>
        <CardDescription>
          Peak activity times (Claim Submissions)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <XAxis 
                type="category" 
                dataKey="day" 
                name="Day" 
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="hour" 
                name="Hour" 
                domain={[8, 18]} 
                tickCount={11}
                label={{ value: 'Hour of Day', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis type="number" dataKey="value" range={[0, 500]} name="Claims" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={chartData} shape="square">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value > 5 ? '#ef4444' : entry.value > 2 ? '#f97316' : '#22c55e'} 
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

