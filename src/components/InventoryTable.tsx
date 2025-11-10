import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface InventoryItem {
  productName: string;
  inStock: number;
  allocated: number;
  consumed: number;
  availableStock: number;
  onOrderP1: number;
  onOrderP2a: number;
  onOrderP2b: number;
  totalOnOrder: number;
  signedQuotations: number;
  projectedStock: number;
  safetyStock: number;
  stockDaysLeft?: number;
}

interface InventoryTableProps {
  data: InventoryItem[];
  filterStatus?: 'critical' | 'reorder' | 'healthy' | null;
}

export const InventoryTable = ({ data, filterStatus }: InventoryTableProps) => {
  const calculateStockDaysLeft = (projectedStock: number, consumed30d: number) => {
    if (consumed30d === 0) return Infinity;
    const dailyConsumption = consumed30d / 30;
    return Math.round(projectedStock / dailyConsumption);
  };

  const getStockStatus = (stockDaysLeft: number) => {
    if (stockDaysLeft < 15) {
      return { status: "critical", label: "Critical", color: "bg-destructive text-destructive-foreground" };
    } else if (stockDaysLeft < 30) {
      return { status: "reorder", label: "Re-order", color: "bg-warning text-warning-foreground" };
    } else {
      return { status: "healthy", label: "Healthy", color: "bg-success text-success-foreground" };
    }
  };

  const getRowColor = (stockDaysLeft: number) => {
    if (stockDaysLeft < 15) {
      return "bg-destructive/5 hover:bg-destructive/10";
    } else if (stockDaysLeft < 30) {
      return "bg-warning/5 hover:bg-warning/10";
    } else {
      return "bg-success/5 hover:bg-success/10";
    }
  };

  const filteredData = filterStatus 
    ? data.filter(item => {
        const stockDaysLeft = calculateStockDaysLeft(item.projectedStock, item.consumed);
        const status = getStockStatus(stockDaysLeft);
        return status.status === filterStatus;
      })
    : data;

  const calculateRecommendedOrder = (projectedStock: number, consumed30d: number) => {
    const targetStock = consumed30d + 25; // 1 month buffer + 25 unit safety stock
    const recommendedQty = targetStock - projectedStock;
    return recommendedQty > 0 ? recommendedQty : 0;
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Product Name</TableHead>
            <TableHead className="text-center font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Stock Days Left</TableHead>
            <TableHead className="text-right font-semibold">Projected Stock</TableHead>
            <TableHead className="text-right font-semibold">In Stock</TableHead>
            <TableHead className="text-right font-semibold">Allocated (Open Jobs)</TableHead>
            <TableHead className="text-right font-semibold">Available (Unallocated)</TableHead>
            <TableHead colSpan={3} className="text-center font-semibold border-l border-r bg-muted/70">
              Inbound Pipeline
            </TableHead>
            <TableHead className="text-right font-semibold">Signed Quotes</TableHead>
            <TableHead className="text-right font-semibold">Consumed (30d)</TableHead>
            <TableHead className="text-right font-semibold text-primary">Recommended Order Qty</TableHead>
          </TableRow>
          <TableRow className="bg-muted/30">
            <TableHead className="h-0 p-0" />
            <TableHead className="h-0 p-0" />
            <TableHead className="h-0 p-0" />
            <TableHead className="h-0 p-0" />
            <TableHead className="h-0 p-0" />
            <TableHead className="h-0 p-0" />
            <TableHead className="h-0 p-0" />
            <TableHead className="text-right text-xs font-medium border-l">Local (14d)</TableHead>
            <TableHead className="text-right text-xs font-medium">Shipment A (60d)</TableHead>
            <TableHead className="text-right text-xs font-medium border-r">Shipment B (60d)</TableHead>
            <TableHead className="h-0 p-0" />
            <TableHead className="h-0 p-0" />
            <TableHead className="h-0 p-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item, index) => {
            const stockDaysLeft = calculateStockDaysLeft(item.projectedStock, item.consumed);
            const stockStatus = getStockStatus(stockDaysLeft);
            const recommendedOrder = calculateRecommendedOrder(item.projectedStock, item.consumed);
            const unallocatedStock = item.inStock - item.allocated;
            
            return (
              <TableRow key={index} className={cn("transition-colors", getRowColor(stockDaysLeft))}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell className="text-center">
                  <Badge className={stockStatus.color}>
                    {stockStatus.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold text-foreground">
                  {stockDaysLeft === Infinity ? '∞' : `${stockDaysLeft}d`}
                </TableCell>
                <TableCell className="text-right font-bold">{item.projectedStock}</TableCell>
                <TableCell className="text-right">{item.inStock}</TableCell>
                <TableCell className="text-right text-muted-foreground">{item.allocated}</TableCell>
                <TableCell className="text-right font-medium">{unallocatedStock}</TableCell>
                <TableCell className="text-right border-l">{item.onOrderP1}</TableCell>
                <TableCell className="text-right">{item.onOrderP2a}</TableCell>
                <TableCell className="text-right border-r">{item.onOrderP2b}</TableCell>
                <TableCell className="text-right">{item.signedQuotations}</TableCell>
                <TableCell className="text-right text-muted-foreground">{item.consumed}</TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {recommendedOrder > 0 ? recommendedOrder : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
