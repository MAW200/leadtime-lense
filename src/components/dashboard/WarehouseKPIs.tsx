import { useWarehouseMetrics } from '@/hooks/useDashboardMetrics';
import { useNavigate } from 'react-router-dom';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AlertTriangle, ClipboardList, Truck, PackageX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const WarehouseKPIs = () => {
  const { data: metrics, isLoading } = useWarehouseMetrics();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const stockouts = metrics?.stockouts || 0;
  const pendingClaims = metrics?.pendingClaimsCount || 0;
  const inboundToday = metrics?.inboundToday || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="STOCKOUTS"
        value={stockouts}
        icon={AlertTriangle}
        iconBgColor="bg-destructive"
        description="Items with 0 stock allocated"
        bgColor="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
        onClick={() => navigate('/products?stock=critical')}
      />
      <MetricCard
        title="PENDING CLAIMS"
        value={pendingClaims}
        icon={ClipboardList}
        iconBgColor="bg-orange-500"
        description="Claims waiting for approval"
        bgColor="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900"
        onClick={() => navigate('/warehouse/pending-claims')}
      />
      <MetricCard
        title="INBOUND TODAY"
        value={inboundToday}
        icon={Truck}
        iconBgColor="bg-blue-500"
        description="Shipments expected today"
        onClick={() => navigate('/purchase-orders?po_status=in_transit')}
      />
      {/* Placeholder for Returns or other metric if needed */}
      <MetricCard
        title="RETURNS PROCESSING"
        value={0} 
        icon={PackageX}
        iconBgColor="bg-purple-500"
        description="Items awaiting inspection"
        onClick={() => navigate('/warehouse/pending-returns')}
      />
    </div>
  );
};

