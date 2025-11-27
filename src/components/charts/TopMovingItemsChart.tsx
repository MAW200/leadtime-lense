import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';

interface TopMovingItemsChartProps {
    data?: { name: string; consumed: number }[];
}

const defaultData = [
    { name: 'Cable Assembly XL', consumed: 450 },
    { name: 'Power Supply 12V', consumed: 380 },
    { name: 'LED Module Pro', consumed: 320 },
    { name: 'Connector Kit', consumed: 285 },
    { name: 'Circuit Board v3', consumed: 250 },
];

export const TopMovingItemsChart = ({ data = defaultData }: TopMovingItemsChartProps) => {
    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Top Moving Items</h3>
                    <p className="text-sm text-muted-foreground">Highest consumption in last 30 days</p>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={true} vertical={false} />
                        <XAxis
                            type="number"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            width={95}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            }}
                            formatter={(value: number) => [`${value} units`, 'Consumed']}
                        />
                        <Bar
                            dataKey="consumed"
                            fill="hsl(var(--chart-2))"
                            radius={[0, 8, 8, 0]}
                            maxBarSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
