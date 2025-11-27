import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useWarehouseMetrics } from '@/hooks/useDashboardMetrics';
import { TrendingDown, AlertTriangle, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ExecutiveFlowAlerts = () => {
  const { data: metrics } = useDashboardMetrics();
  const { data: warehouseMetrics } = useWarehouseMetrics();
  const navigate = useNavigate();

  const leakage = metrics?.systemLeakage || 0;
  const stockouts = warehouseMetrics?.stockouts || 0;
  const inboundToday = warehouseMetrics?.inboundToday || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Alert
        variant="destructive"
        className="bg-destructive/10 border-destructive/40 cursor-pointer hover:shadow-md"
        onClick={() => navigate('/warehouse/stock-adjustments')}
      >
        <TrendingDown className="h-4 w-4" />
        <AlertTitle>System Leakage</AlertTitle>
        <AlertDescription>
          {leakage > 0
            ? `Losses recorded this week total ${leakage.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}. Click to review adjustments.`
            : 'No shrinkage recorded this week.'}
        </AlertDescription>
      </Alert>

      <Alert
        variant="default"
        className="bg-yellow-500/10 border-yellow-500/40 cursor-pointer hover:shadow-md"
        onClick={() => navigate('/products?stock=critical')}
      >
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle>Critical Stockouts</AlertTitle>
        <AlertDescription>
          {stockouts > 0
            ? `${stockouts} SKUs require immediate replenishment. Click to view in Products.`
            : 'All SKUs are above safety stock.'}
        </AlertDescription>
      </Alert>

      <Alert
        variant="default"
        className="bg-blue-500/10 border-blue-500/40 cursor-pointer hover:shadow-md"
        onClick={() => navigate('/purchase-orders?status=in_transit')}
      >
        <Truck className="h-4 w-4 text-blue-600" />
        <AlertTitle>Inbound Today</AlertTitle>
        <AlertDescription>
          {inboundToday > 0
            ? `${inboundToday} PO${inboundToday === 1 ? '' : 's'} scheduled to arrive today. Click to view POs.`
            : 'No inbound shipments scheduled today.'}
        </AlertDescription>
      </Alert>
    </div>
  );
};

