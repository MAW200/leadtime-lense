import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useProjectMetrics } from '@/hooks/useProjectMetrics';
import { Skeleton } from '@/components/ui/skeleton';
import { useRole } from '@/contexts/RoleContext';

export const EmergencyRatioChart = () => {
  const { currentRole } = useRole();
  const userId = currentRole === 'onsite_team' ? 'u3' : undefined;
  const { data, isLoading } = useProjectMetrics(userId);

  const chartData = useMemo(() => {
    if (!data?.claimRatio) return [];
    
    const { emergency, standard } = data.claimRatio;
    // Avoid empty chart
    if (emergency === 0 && standard === 0) return [];

    return [
      { name: 'Standard', value: standard, color: '#22c55e' }, // green-500
      { name: 'Emergency', value: emergency, color: '#ef4444' }, // red-500
    ];
  }, [data]);

  if (isLoading) return <Skeleton className="h-[350px] w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Claim Ratio</CardTitle>
        <CardDescription>Standard vs. Unplanned Requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }}
                 formatter={(value: number) => [`${value} Claims`, '']}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

