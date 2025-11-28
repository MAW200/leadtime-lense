import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const mockData = [
  { month: 'Jan', claims: 2400, spend: 1100 },
  { month: 'Feb', claims: 1800, spend: 900 },
  { month: 'Mar', claims: 2600, spend: 1700 },
  { month: 'Apr', claims: 2000, spend: 2100 },
  { month: 'May', claims: 2200, spend: 2300 },
  { month: 'Jun', claims: 1900, spend: 2000 },
  { month: 'Jul', claims: 2800, spend: 2400 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const claims = payload.find((p: any) => p.dataKey === 'claims');
  const spend = payload.find((p: any) => p.dataKey === 'spend');

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-2xl backdrop-blur-sm">
      <p className="text-sm font-semibold text-white mb-1">{label}</p>
      <div className="space-y-1 text-xs text-white/80">
        <p className="flex items-center justify-between gap-6">
          <span>Materials Claimed:</span>
          <span className="font-semibold">${claims?.value?.toLocaleString()}</span>
        </p>
        <p className="flex items-center justify-between gap-6">
          <span>Restocking Spend:</span>
          <span className="font-semibold text-emerald-300">${spend?.value?.toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
};

export const ProjectBurnChart = () => {
  return (
    <Card className="bg-slate-950 border-white/5 text-white shadow-2xl">
      <CardHeader>
        <CardTitle className="text-white">Project "Burn" Rate</CardTitle>
        <CardDescription className="text-white/70">
          Materials Claimed (Bar) vs. Restocking Spend (Line)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mockData} margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.8} />
                </linearGradient>
                <filter id="glow" height="130%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#34d399" />
                </filter>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(val) => `$${val / 1000}k`}
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(val) => `$${val / 1000}k`}
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#38bdf8', strokeOpacity: 0.2 }} />
              <Bar
                yAxisId="left"
                dataKey="claims"
                name="Materials Claimed"
                barSize={32}
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
                opacity={0.95}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="spend"
                name="Restocking Spend"
                stroke="#34d399"
                strokeWidth={3}
                dot={{ r: 5, fill: '#0f172a', strokeWidth: 2, stroke: '#34d399', filter: 'url(#glow)' }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-8 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-gradient-to-b from-sky-300 to-blue-900" />
            Materials Claimed
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            Restocking Spend
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

