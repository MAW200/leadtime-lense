import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface ClaimsStatusChartProps {
    pendingCount?: number;
    approvedCount?: number;
    deniedCount?: number;
}

export const ClaimsStatusChart = ({
    pendingCount = 0,
    approvedCount = 0,
    deniedCount = 0
}: ClaimsStatusChartProps) => {
    const data = [
        { name: 'Pending', value: pendingCount, color: 'hsl(var(--warning))' },
        { name: 'Approved', value: approvedCount, color: 'hsl(var(--success))' },
        { name: 'Denied', value: deniedCount, color: 'hsl(var(--destructive))' },
    ].filter(item => item.value > 0);

    const COLORS = data.map(d => d.color);

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Claims Status</h3>
                    <p className="text-sm text-muted-foreground">Overview of recent claims</p>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                }}
                                formatter={(value: number) => [`${value} Claims`, '']}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Card>
    );
};

