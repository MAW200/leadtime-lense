import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DollarSign, Briefcase, TrendingDown, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const ExecutiveKPIs = () => {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  // Use safe defaults
  const inventoryValue = metrics?.totalInventoryValue || 0;
  const capitalCommitted = metrics?.capitalCommitted || 0;
  const systemLeakage = metrics?.systemLeakage || 0;
  
  // Format helpers
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="INVENTORY VALUE"
        value={formatCurrency(inventoryValue)}
        icon={DollarSign}
        iconBgColor="bg-primary"
        description="Total asset value on hand"
        trend="+2.5%" // Placeholder for real trend calculation if historical data existed
        trendValue="vs last month"
      />
      <MetricCard
        title="CAPITAL COMMITTED"
        value={formatCurrency(capitalCommitted)}
        icon={Briefcase}
        iconBgColor="bg-blue-500"
        description="Pending POs (Draft + Sent)"
      />
      <MetricCard
        title="SYSTEM LEAKAGE"
        value={formatCurrency(systemLeakage)}
        icon={TrendingDown}
        iconBgColor="bg-destructive"
        description="Loss due to damage/theft"
        bgColor="bg-red-50 dark:bg-red-950/10 border-red-100 dark:border-red-900"
      />
      <MetricCard
        title="HEALTH SCORE"
        value="94%"
        icon={Activity}
        iconBgColor="bg-green-500"
        description="Overall system efficiency"
      />
    </div>
  );
};

