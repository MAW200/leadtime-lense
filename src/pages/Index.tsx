import { MetricCard } from "@/components/MetricCard";
import { InventoryTable } from "@/components/InventoryTable";
import { mockInventoryData } from "@/data/mockInventoryData";
import { Package, TrendingUp, AlertTriangle, ShoppingCart, Filter, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  // Calculate summary metrics from the data
  const totalInventoryValue = mockInventoryData.reduce((sum, item) => sum + (item.availableStock * 125), 0);
  const totalStockAvailable = mockInventoryData.reduce((sum, item) => sum + item.availableStock, 0);
  const totalConsumed = mockInventoryData.reduce((sum, item) => sum + item.consumed, 0);
  const activeOrders = mockInventoryData.filter(item => item.totalOnOrder > 0).length;
  const criticalItems = mockInventoryData.filter(item => item.projectedStock < 0).length;
  const lowStockItems = mockInventoryData.filter(item => item.projectedStock >= 0 && item.projectedStock <= item.safetyStock).length;

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
          />
          <MetricCard
            title="STOCK AVAILABLE"
            value={totalStockAvailable.toLocaleString()}
            icon={TrendingUp}
            iconBgColor="bg-chart-2"
          />
          <MetricCard
            title="ACTIVE ORDERS"
            value={activeOrders}
            icon={ShoppingCart}
            iconBgColor="bg-chart-3"
          />
          <MetricCard
            title="CRITICAL ITEMS"
            value={criticalItems}
            icon={AlertTriangle}
            iconBgColor="bg-destructive"
          />
          <MetricCard
            title="LOW STOCK ITEMS"
            value={lowStockItems}
            icon={AlertTriangle}
            iconBgColor="bg-warning"
          />
        </div>

        {/* Inventory Planning Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Inventory Projection with Lead Times</h2>
              <p className="text-sm text-muted-foreground mt-1">
                P1: 14-day local orders | P2a/P2b: 60-day China shipments | Projected from signed quotations + 1-month buffer | Safety stock: 25 units
              </p>
            </div>
          </div>
          
          <InventoryTable data={mockInventoryData} />

          {/* Legend */}
          <div className="flex items-center gap-6 p-4 bg-card rounded-lg border">
            <p className="text-sm font-medium text-muted-foreground">Status Legend:</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success"></div>
              <span className="text-sm">Healthy (&gt; 25 units)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning"></div>
              <span className="text-sm">Low Stock (0-25 units)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive"></div>
              <span className="text-sm">Critical (&lt; 0 units)</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
