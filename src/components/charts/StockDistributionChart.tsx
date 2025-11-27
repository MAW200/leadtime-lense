import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface StockDistributionChartProps {
    criticalCount?: number;
    lowStockCount?: number;
    healthyCount?: number;
}

export const StockDistributionChart = ({
    criticalCount = 0,
    lowStockCount = 0,
    healthyCount = 0
}: StockDistributionChartProps) => {
    const data = [
        { name: 'Critical', value: criticalCount, color: 'hsl(var(--destructive))' },
        { name: 'Low Stock', value: lowStockCount, color: 'hsl(var(--warning))' },
        { name: 'Healthy', value: healthyCount, color: 'hsl(var(--success))' },
    ];

    const COLORS = data.map(d => d.color);

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Stock Status Distribution</h3>
                    <p className="text-sm text-muted-foreground">Inventory health overview</p>
                </div>

                <ResponsiveContainer width="100%" height={300}>
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
                            formatter={(value: number) => [`${value} items`, '']}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
                        <p className="text-xs text-muted-foreground">Critical</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-warning">{lowStockCount}</p>
                        <p className="text-xs text-muted-foreground">Low Stock</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-success">{healthyCount}</p>
                        <p className="text-xs text-muted-foreground">Healthy</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};
