import { MetricCard } from "@/components/MetricCard";
import { InventoryTable } from "@/components/InventoryTable";
import { mockInventoryData } from "@/data/mockInventoryData";
import { Package, TrendingUp, AlertTriangle, ShoppingCart, Filter, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Index = () => {
  const [filterStatus, setFilterStatus] = useState<'critical' | 'reorder' | 'healthy' | null>(null);

  const calculateStockDaysLeft = (projectedStock: number, consumed30d: number) => {
    if (consumed30d === 0) return Infinity;
    const dailyConsumption = consumed30d / 30;
    return Math.round(projectedStock / dailyConsumption);
  };

  // Calculate summary metrics from the data
  const totalInventoryValue = mockInventoryData.reduce((sum, item) => sum + (item.availableStock * 125), 0);
  const totalStockAvailable = mockInventoryData.reduce((sum, item) => sum + item.availableStock, 0);
  const totalConsumed = mockInventoryData.reduce((sum, item) => sum + item.consumed, 0);
  const activeOrders = mockInventoryData.filter(item => item.totalOnOrder > 0).length;
  
  const criticalItems = mockInventoryData.filter(item => {
    const daysLeft = calculateStockDaysLeft(item.projectedStock, item.consumed);
    return daysLeft < 15;
  }).length;
  
  const lowStockItems = mockInventoryData.filter(item => {
    const daysLeft = calculateStockDaysLeft(item.projectedStock, item.consumed);
    return daysLeft >= 15 && daysLeft < 30;
  }).length;

  // Mock sparkline data (30 days)
  const inventoryValueSparkline = [0.16, 0.165, 0.17, 0.168, 0.175, 0.178, 0.18];
  const stockAvailableSparkline = [1580, 1550, 1520, 1510, 1500, 1490, 1480];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Inventory Planning Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
          <MetricCard
            title="CRITICAL ITEMS"
            value={criticalItems}
            icon={AlertTriangle}
            iconBgColor="bg-destructive"
            clickable
            onClick={() => setFilterStatus(filterStatus === 'critical' ? null : 'critical')}
          />
          <MetricCard
            title="LOW STOCK ITEMS"
            value={lowStockItems}
            icon={AlertTriangle}
            iconBgColor="bg-warning"
            clickable
            onClick={() => setFilterStatus(filterStatus === 'reorder' ? null : 'reorder')}
          />
        </div>

        {/* Inventory Planning Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Inventory Projection with Lead Times</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Local: 14-day orders | Shipment A/B: 60-day China shipments | Projected from signed quotations + 1-month buffer
              </p>
              {filterStatus && (
                <p className="text-sm font-medium text-primary mt-2">
                  Filtering by: {filterStatus === 'critical' ? 'Critical' : filterStatus === 'reorder' ? 'Re-order' : 'Healthy'} items
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
          
          <InventoryTable data={mockInventoryData} filterStatus={filterStatus} />

          {/* Legend */}
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
      </main>
    </div>
  );
};

export default Index;
