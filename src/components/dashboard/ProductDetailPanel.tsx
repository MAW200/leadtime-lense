import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InventoryItem } from "@/lib/supabase";
import { Package, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useProductVendors } from "@/hooks/useInventory";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface ProductDetailPanelProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailPanel = ({ item, isOpen, onClose }: ProductDetailPanelProps) => {
  const navigate = useNavigate();
  const [isCalculationOpen, setIsCalculationOpen] = useState(false);
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
  const dailyConsumption = item.consumed_30d / 30;

  const primaryVendor = productVendors?.find(pv => pv.is_primary) || productVendors?.[0];

  const handleCreateOrder = () => {
    if (!primaryVendor) {
      return;
    }

    navigate('/purchase-orders', {
      state: {
        preFill: {
          vendorId: primaryVendor.vendor_id,
          productId: item.id,
          quantity: recommendedOrder,
          unitPrice: Number(primaryVendor.unit_price) || 0,
        },
      },
    });
    onClose();
  };

  // Handle both nested and flat vendor structures
  const getVendorName = () => {
    if (!primaryVendor) return null;
    return primaryVendor.vendor?.name || primaryVendor.vendor_name || 'Unknown Vendor';
  };

  const getVendorEmail = () => {
    if (!primaryVendor) return null;
    return primaryVendor.vendor?.contact_email || primaryVendor.contact_email || null;
  };

  const getVendorCountry = () => {
    if (!primaryVendor) return null;
    return primaryVendor.vendor?.country || primaryVendor.country || 'N/A';
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">{item.product_name}</SheetTitle>
          <SheetDescription className="flex items-center gap-2 mt-2">
            <span className="text-sm font-mono bg-muted px-2 py-1 rounded">SKU: {item.sku}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border-2 border-primary/20">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Stock Analysis</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <p className="text-xs text-muted-foreground mb-1">Projected Days of Stock</p>
                <p className="text-5xl font-bold text-primary">
                  {stockDaysLeft === Infinity ? '∞' : `${stockDaysLeft}d`}
                </p>
                <Badge className={`${stockStatus.color} mt-2`}>{stockStatus.label}</Badge>
              </div>
              <div className="col-span-1">
                <p className="text-xs text-muted-foreground mb-1">Projected Balance</p>
                <p className="text-4xl font-bold text-foreground">{item.projected_stock}</p>
                <p className="text-xs text-muted-foreground mt-2">units</p>
              </div>
              <div className="col-span-1">
                <p className="text-xs text-muted-foreground mb-1">Safety Stock Threshold</p>
                <p className="text-4xl font-bold text-foreground">{item.safety_stock}</p>
                <p className="text-xs text-muted-foreground mt-2">units</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/30 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Recommended Action</h3>
            {recommendedOrder > 0 ? (
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full text-lg py-6 font-semibold"
                  onClick={handleCreateOrder}
                  disabled={!primaryVendor}
                >
                  Create Order: {recommendedOrder} units
                </Button>
                <button
                  onClick={() => setIsCalculationOpen(!isCalculationOpen)}
                  className="text-xs text-primary hover:underline w-full text-center"
                >
                  How is this calculated?
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-lg font-semibold text-success">No order needed</p>
                <p className="text-sm text-muted-foreground mt-1">Stock levels are sufficient</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="bg-muted/30 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Vendor Information</h3>
            {recommendedOrder > 0 && (
              <p className="text-xs text-muted-foreground mb-4 italic">
                The "Create Order" button will use this vendor
              </p>
            )}

            {vendorsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : primaryVendor ? (
              <div className="border-2 border-primary/30 rounded-lg p-4 bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold">{getVendorName()}</p>
                      {primaryVendor.is_primary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    {getVendorEmail() && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {getVendorEmail()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-muted/50 rounded p-2">
                    <span className="text-xs text-muted-foreground">Unit Price</span>
                    <p className="text-lg font-bold">${(Number(primaryVendor.unit_price) || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <span className="text-xs text-muted-foreground">Lead Time</span>
                    <p className="text-lg font-bold">{primaryVendor.lead_time_days || 0} days</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <span className="text-xs text-muted-foreground">Min Order</span>
                    <p className="text-lg font-bold">{primaryVendor.minimum_order_qty || 0} units</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <span className="text-xs text-muted-foreground">Country</span>
                    <p className="text-lg font-bold">{getVendorCountry()}</p>
                  </div>
                </div>
                {primaryVendor.vendor_sku && (
                  <p className="text-xs text-muted-foreground mt-3 font-mono bg-muted/30 px-2 py-1 rounded">
                    Vendor SKU: {primaryVendor.vendor_sku}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No vendor information available
              </p>
            )}

            {productVendors && productVendors.length > 1 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  {productVendors.length - 1} alternative vendor{productVendors.length > 2 ? 's' : ''} available
                </p>
              </div>
            )}
          </div>

          <Separator />

          <Collapsible open={isCalculationOpen} onOpenChange={setIsCalculationOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between" size="lg">
                <span className="font-semibold">Show Calculation Details</span>
                {isCalculationOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold">Supply & Pipeline</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total In Stock</p>
                    <p className="text-2xl font-bold">{item.in_stock}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">On-Hand (Unclaimed)</p>
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

              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-chart-3" />
                  <h3 className="text-base font-semibold">Demand & Forecasting</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Claimed (Open Jobs)</p>
                    <p className="text-2xl font-bold">{item.allocated}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Forecasted Demand (Quotes)</p>
                    <p className="text-2xl font-bold">{item.signed_quotations}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. 30-Day Consumption</p>
                    <p className="text-xl font-semibold">{item.consumed_30d}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Consumption</p>
                    <p className="text-xl font-semibold">{dailyConsumption.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <h4 className="text-sm font-semibold mb-2">Calculation Formula</h4>
                <div className="text-xs text-muted-foreground space-y-1 font-mono">
                  <p>Projected Balance = {item.projected_stock}</p>
                  <p>Daily Consumption = {dailyConsumption.toFixed(1)} units/day</p>
                  <p>Days of Stock = {stockDaysLeft === Infinity ? '∞' : stockDaysLeft} days</p>
                  <p className="mt-2 pt-2 border-t">Target Stock = Avg. 30-Day + Safety Stock</p>
                  <p>Recommended Order = Target - Projected Balance</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </SheetContent>
    </Sheet>
  );
};
