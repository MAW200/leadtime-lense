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
import { InventoryItem } from "@/lib/supabase";
import { MousePointer } from "lucide-react";

interface InventoryTableProps {
  data: InventoryItem[];
  filterStatus?: 'critical' | 'reorder' | 'healthy' | null;
  onRowClick: (item: InventoryItem) => void;
}

export const InventoryTable = ({ data, filterStatus, onRowClick }: InventoryTableProps) => {
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
        const stockDaysLeft = calculateStockDaysLeft(item.projected_stock, item.consumed_30d);
        const status = getStockStatus(stockDaysLeft);
        return status.status === filterStatus;
      })
    : data;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">
              <div className="flex items-center gap-2">
                Product Name
                <MousePointer className="h-3 w-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead className="text-center font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Stock Days Left</TableHead>
            <TableHead className="text-right font-semibold">Projected Stock</TableHead>
            <TableHead className="text-right font-semibold">Available (Unallocated)</TableHead>
            <TableHead className="text-right font-semibold">In Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No items match the current filter
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((item) => {
              const stockDaysLeft = calculateStockDaysLeft(item.projected_stock, item.consumed_30d);
              const stockStatus = getStockStatus(stockDaysLeft);
              const availableStock = item.in_stock - item.allocated;

              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    "transition-all cursor-pointer",
                    getRowColor(stockDaysLeft)
                  )}
                  onClick={() => onRowClick(item)}
                >
                  <TableCell className="font-medium hover:text-primary transition-colors">
                    {item.product_name}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={stockStatus.color}>
                      {stockStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    {stockDaysLeft === Infinity ? '∞' : `${stockDaysLeft}d`}
                  </TableCell>
                  <TableCell className="text-right font-bold">{item.projected_stock}</TableCell>
                  <TableCell className="text-right font-medium text-primary">{availableStock}</TableCell>
                  <TableCell className="text-right">{item.in_stock}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
