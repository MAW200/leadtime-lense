import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useProjectMetrics } from '@/hooks/useProjectMetrics';
import { Skeleton } from '@/components/ui/skeleton';
import { useRole } from '@/contexts/RoleContext';

export const PhaseProgressChart = () => {
  const { currentRole } = useRole();
  const userId = currentRole === 'onsite_team' ? 'u3' : undefined;
  const { data, isLoading } = useProjectMetrics(userId);

  const chartData = useMemo(() => {
    if (!data?.phaseStats) return [];

    return Object.entries(data.phaseStats).map(([phase, stats]) => ({
      name: phase, // P1, P2a, P2b
      Required: stats.required,
      Claimed: stats.claimed,
      // Completion % for tooltip
      completion: stats.required > 0 ? Math.round((stats.claimed / stats.required) * 100) : 0
    }));
  }, [data]);

  if (isLoading) return <Skeleton className="h-[350px] w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phase Completion</CardTitle>
        <CardDescription>
          Materials Claimed vs. Required by Phase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))' }}
                formatter={(value, name, props) => {
                    if (name === 'Claimed') {
                        return [`${value} (${props.payload.completion}%)`, name];
                    }
                    return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="Required" fill="hsl(var(--muted))" name="Required Qty" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Claimed" fill="hsl(var(--primary))" name="Claimed Qty" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

