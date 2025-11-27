import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface ProjectStatusChartProps {
    activeCount?: number;
    completedCount?: number;
    onHoldCount?: number;
}

export const ProjectStatusChart = ({
    activeCount = 0,
    completedCount = 0,
    onHoldCount = 0
}: ProjectStatusChartProps) => {
    const data = [
        { name: 'Active', value: activeCount, color: 'hsl(var(--success))' },
        { name: 'Completed', value: completedCount, color: 'hsl(var(--primary))' },
        { name: 'On Hold', value: onHoldCount, color: 'hsl(var(--warning))' },
    ].filter(item => item.value > 0);

    const COLORS = data.map(d => d.color);

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Project Status</h3>
                    <p className="text-sm text-muted-foreground">Active vs Completed projects</p>
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
                                formatter={(value: number) => [`${value} Projects`, '']}
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

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-success">{activeCount}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{completedCount}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-warning">{onHoldCount}</p>
                        <p className="text-xs text-muted-foreground">On Hold</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

