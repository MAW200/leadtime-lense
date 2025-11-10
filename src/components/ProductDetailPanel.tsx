import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InventoryItem } from "@/lib/supabase";
import { Package, TrendingUp, AlertCircle, Calculator } from "lucide-react";
import { useProductVendors } from "@/hooks/useInventory";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ProductDetailPanelProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailPanel = ({ item, isOpen, onClose }: ProductDetailPanelProps) => {
  const [sortBy, setSortBy] = useState<'price' | 'leadTime'>('price');
  const { data: productVendors, isLoading: vendorsLoading } = useProductVendors(item?.id);

  if (!item) return null;

  const calculateStockDaysLeft = (projectedStock: number, consumed30d: number) => {
    if (consumed30d === 0) return Infinity;
    const dailyConsumption = consumed30d / 30;
    return Math.round(projectedStock / dailyConsumption);
  };

  const getStockStatus = (stockDaysLeft: number) => {
    if (stockDaysLeft < 15) {
      return { label: "Critical", color: "bg-destructive text-destructive-foreground" };
    } else if (stockDaysLeft < 30) {
      return { label: "Re-order", color: "bg-warning text-warning-foreground" };
    } else {
      return { label: "Healthy", color: "bg-success text-success-foreground" };
    }
  };

  const calculateRecommendedOrder = (projectedStock: number, consumed30d: number) => {
    const targetStock = consumed30d + item.safety_stock;
    const recommendedQty = targetStock - projectedStock;
    return recommendedQty > 0 ? recommendedQty : 0;
  };

  const stockDaysLeft = calculateStockDaysLeft(item.projected_stock, item.consumed_30d);
  const stockStatus = getStockStatus(stockDaysLeft);
  const recommendedOrder = calculateRecommendedOrder(item.projected_stock, item.consumed_30d);
  const availableStock = item.in_stock - item.allocated;
  const totalPipeline = item.on_order_local_14d + item.on_order_shipment_a_60d + item.on_order_shipment_b_60d;

  const sortedVendors = productVendors ? [...productVendors].sort((a, b) => {
    if (sortBy === 'price') {
      return a.unit_price - b.unit_price;
    }
    return a.lead_time_days - b.lead_time_days;
  }) : [];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">{item.product_name}</SheetTitle>
          <SheetDescription className="flex items-center gap-2 mt-2">
            <span className="text-sm font-mono bg-muted px-2 py-1 rounded">SKU: {item.sku}</span>
            <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Supply & Pipeline</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold">{item.in_stock}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available (Unallocated)</p>
                <p className="text-2xl font-bold text-primary">{availableStock}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inbound (Local 14d)</p>
                <p className="text-xl font-semibold">{item.on_order_local_14d}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inbound (Shipment A 60d)</p>
                <p className="text-xl font-semibold">{item.on_order_shipment_a_60d}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inbound (Shipment B 60d)</p>
                <p className="text-xl font-semibold">{item.on_order_shipment_b_60d}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pipeline</p>
                <p className="text-xl font-semibold text-chart-2">{totalPipeline}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-chart-3" />
              <h3 className="text-lg font-semibold">Demand & Forecasting</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Allocated (Open Jobs)</p>
                <p className="text-2xl font-bold">{item.allocated}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Signed Quotes (Forecast)</p>
                <p className="text-2xl font-bold">{item.signed_quotations}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Consumed (30d Rate)</p>
                <p className="text-xl font-semibold">{item.consumed_30d}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Consumption</p>
                <p className="text-xl font-semibold">{(item.consumed_30d / 30).toFixed(1)}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-5 w-5 text-chart-4" />
              <h3 className="text-lg font-semibold">Stock Analysis</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Stock Days Left</p>
                <p className="text-2xl font-bold">
                  {stockDaysLeft === Infinity ? '∞' : `${stockDaysLeft}d`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projected Stock</p>
                <p className="text-2xl font-bold">{item.projected_stock}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Safety Stock Threshold</p>
                <p className="text-xl font-semibold">{item.safety_stock}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground mb-1">Recommended Order Quantity</p>
                <div className="flex items-center gap-2">
                  {recommendedOrder > 0 ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-warning" />
                      <p className="text-3xl font-bold text-primary">{recommendedOrder}</p>
                      <span className="text-sm text-muted-foreground">units needed</span>
                    </>
                  ) : (
                    <p className="text-xl font-semibold text-success">No order needed</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Vendor Information</h3>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'price' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('price')}
                >
                  Sort by Price
                </Button>
                <Button
                  variant={sortBy === 'leadTime' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('leadTime')}
                >
                  Sort by Lead Time
                </Button>
              </div>
            </div>

            {vendorsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : sortedVendors && sortedVendors.length > 0 ? (
              <div className="space-y-3">
                {sortedVendors.map((pv) => (
                  <div
                    key={pv.id}
                    className="border rounded-lg p-3 bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{pv.vendor?.name}</p>
                          {pv.is_primary && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                          <div>
                            <span className="text-muted-foreground">Price: </span>
                            <span className="font-medium">${pv.unit_price.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Lead Time: </span>
                            <span className="font-medium">{pv.lead_time_days} days</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min Order: </span>
                            <span className="font-medium">{pv.minimum_order_qty} units</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Country: </span>
                            <span className="font-medium">{pv.vendor?.country}</span>
                          </div>
                        </div>
                        {pv.vendor_sku && (
                          <p className="text-xs text-muted-foreground mt-2 font-mono">
                            Vendor SKU: {pv.vendor_sku}
                          </p>
                        )}
                        {pv.vendor?.contact_email && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {pv.vendor.contact_email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No vendor information available
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
