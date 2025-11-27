import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';

interface PurchaseOrderSummaryChartProps {
    draftCount?: number;
    sentCount?: number;
    receivedCount?: number;
    inTransitCount?: number;
}

export const PurchaseOrderSummaryChart = ({
    draftCount = 0,
    sentCount = 0,
    receivedCount = 0,
    inTransitCount = 0
}: PurchaseOrderSummaryChartProps) => {
    const data = [
        { name: 'Draft', value: draftCount, fill: 'hsl(var(--muted-foreground))' },
        { name: 'Sent', value: sentCount, fill: 'hsl(var(--primary))' },
        { name: 'In Transit', value: inTransitCount, fill: 'hsl(var(--warning))' },
        { name: 'Received', value: receivedCount, fill: 'hsl(var(--success))' },
    ];

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Purchase Orders</h3>
                    <p className="text-sm text-muted-foreground">Orders by status</p>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis 
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                }}
                                formatter={(value: number) => [`${value} Orders`, 'Count']}
                            />
                            <Bar 
                                dataKey="value" 
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Card>
    );
};

