import { MetricCard } from "@/components/MetricCard";
import { InventoryTable } from "@/components/InventoryTable";
import { ProductDetailPanel } from "@/components/ProductDetailPanel";
import { TopHeader } from "@/components/TopHeader";
import { TrendingUp, AlertTriangle, ShoppingCart, Filter, BarChart3, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useInventoryItems } from "@/hooks/useInventory";
import { InventoryItem } from "@/lib/supabase";

const Index = () => {
  const [filterStatus, setFilterStatus] = useState<'critical' | 'reorder' | 'healthy' | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const { data: inventoryData, isLoading } = useInventoryItems();

  const calculateStockDaysLeft = (projectedStock: number, consumed30d: number) => {
    if (consumed30d === 0) return Infinity;
    const dailyConsumption = consumed30d / 30;
    return Math.round(projectedStock / dailyConsumption);
  };

  const totalInventoryValue = inventoryData?.reduce((sum, item) => sum + (item.in_stock * (Number(item.unit_cost) || 0)), 0) || 0;
  const totalStockAvailable = inventoryData?.reduce((sum, item) => sum + item.in_stock, 0) || 0;
  const activeOrders = inventoryData?.filter(item =>
    (item.on_order_local_14d + item.on_order_shipment_a_60d + item.on_order_shipment_b_60d) > 0
  ).length || 0;

  const criticalItems = inventoryData?.filter(item => {
    const daysLeft = calculateStockDaysLeft(item.projected_stock, item.consumed_30d);
    return daysLeft < 15;
  }).length || 0;

  const lowStockItems = inventoryData?.filter(item => {
    const daysLeft = calculateStockDaysLeft(item.projected_stock, item.consumed_30d);
    return daysLeft >= 15 && daysLeft < 30;
  }).length || 0;

  const inventoryValueSparkline = [0.16, 0.165, 0.17, 0.168, 0.175, 0.178, 0.18];
  const stockAvailableSparkline = [1580, 1550, 1520, 1510, 1500, 1490, 1480];

  const handleRowClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsPanelOpen(true);
  };

  const handleFilterClick = (status: 'critical' | 'reorder') => {
    setFilterStatus(filterStatus === status ? null : status);
  };

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Dashboard"
        description="Monitor inventory levels and take action on critical items"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <>
            <div className="space-y-6 mb-8">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Action Center</h2>
                <p className="text-sm text-muted-foreground">Items requiring immediate attention</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetricCard
                  title="CRITICAL ITEMS"
                  value={criticalItems}
                  icon={AlertTriangle}
                  iconBgColor="bg-destructive"
                  clickable
                  actionCard
                  bgColor="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                  onClick={() => handleFilterClick('critical')}
                />
                <MetricCard
                  title="LOW STOCK ITEMS"
                  value={lowStockItems}
                  icon={AlertTriangle}
                  iconBgColor="bg-warning"
                  clickable
                  actionCard
                  bgColor="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900"
                  onClick={() => handleFilterClick('reorder')}
                />
              </div>
            </div>

            <Separator className="my-8" />

            <div className="space-y-6 mb-8">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Overview Metrics</h2>
                <p className="text-sm text-muted-foreground">Informational snapshot of inventory status</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="INVENTORY VALUE"
                  value={`$${(totalInventoryValue / 1000000).toFixed(2)}M`}
                  icon={Package}
                  iconBgColor="bg-primary"
                  trendValue="+2.1%"
                  trend="vs. last month"
                  sparklineData={inventoryValueSparkline}
                />
                <MetricCard
                  title="STOCK AVAILABLE"
                  value={totalStockAvailable.toLocaleString()}
                  icon={TrendingUp}
                  iconBgColor="bg-chart-2"
                  trendValue="-50"
                  trend="vs. last week"
                  sparklineData={stockAvailableSparkline}
                />
                <MetricCard
                  title="ACTIVE ORDERS"
                  value={activeOrders}
                  icon={ShoppingCart}
                  iconBgColor="bg-chart-3"
                  trendValue="+2"
                  trend="from yesterday"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Inventory Overview</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click any row to view detailed supply chain information and vendor options
                  </p>
                  {filterStatus && (
                    <p className="text-sm font-medium text-primary mt-2">
                      Filtering by: {filterStatus === 'critical' ? 'Critical' : 'Re-order'} items
                      <button
                        onClick={() => setFilterStatus(null)}
                        className="ml-2 text-xs underline hover:no-underline"
                      >
                        Clear filter
                      </button>
                    </p>
                  )}
                </div>
              </div>

              <InventoryTable
                data={inventoryData || []}
                filterStatus={filterStatus}
                onRowClick={handleRowClick}
              />

              <div className="flex items-center gap-6 p-4 bg-card rounded-lg border">
                <p className="text-sm font-medium text-muted-foreground">Status Legend:</p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-success"></div>
                  <span className="text-sm">Healthy (&gt; 30 days)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-warning"></div>
                  <span className="text-sm">Re-order (15-30 days)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-destructive"></div>
                  <span className="text-sm">Critical (&lt; 15 days)</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <ProductDetailPanel
        item={selectedItem}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
};

export default Index;
