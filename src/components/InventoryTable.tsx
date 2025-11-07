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
  consumed: number;
  availableStock: number;
  onOrderP1: number;
  onOrderP2a: number;
  onOrderP2b: number;
  totalOnOrder: number;
  signedQuotations: number;
  projectedStock: number;
  safetyStock: number;
}

interface InventoryTableProps {
  data: InventoryItem[];
}

export const InventoryTable = ({ data }: InventoryTableProps) => {
  const getStockStatus = (projectedStock: number, safetyStock: number) => {
    if (projectedStock < 0) {
      return { status: "critical", label: "Critical", color: "bg-destructive text-destructive-foreground" };
    } else if (projectedStock <= safetyStock) {
      return { status: "warning", label: "Low Stock", color: "bg-warning text-warning-foreground" };
    } else {
      return { status: "healthy", label: "Healthy", color: "bg-success text-success-foreground" };
    }
  };

  const getRowColor = (projectedStock: number, safetyStock: number) => {
    if (projectedStock < 0) {
      return "bg-destructive/5 hover:bg-destructive/10";
    } else if (projectedStock <= safetyStock) {
      return "bg-warning/5 hover:bg-warning/10";
    } else {
      return "bg-success/5 hover:bg-success/10";
    }
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Product Name</TableHead>
            <TableHead className="text-right font-semibold">In Stock</TableHead>
            <TableHead className="text-right font-semibold">Consumed</TableHead>
            <TableHead className="text-right font-semibold">Available</TableHead>
            <TableHead className="text-right font-semibold">P1 (14d)</TableHead>
            <TableHead className="text-right font-semibold">P2a (60d)</TableHead>
            <TableHead className="text-right font-semibold">P2b (60d)</TableHead>
            <TableHead className="text-right font-semibold">Total On Order</TableHead>
            <TableHead className="text-right font-semibold">Signed Quotes</TableHead>
            <TableHead className="text-right font-semibold">Projected Stock</TableHead>
            <TableHead className="text-center font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const stockStatus = getStockStatus(item.projectedStock, item.safetyStock);
            return (
              <TableRow key={index} className={cn("transition-colors", getRowColor(item.projectedStock, item.safetyStock))}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell className="text-right">{item.inStock}</TableCell>
                <TableCell className="text-right text-destructive">{item.consumed}</TableCell>
                <TableCell className="text-right font-medium">{item.availableStock}</TableCell>
                <TableCell className="text-right">{item.onOrderP1}</TableCell>
                <TableCell className="text-right">{item.onOrderP2a}</TableCell>
                <TableCell className="text-right">{item.onOrderP2b}</TableCell>
                <TableCell className="text-right font-medium">{item.totalOnOrder}</TableCell>
                <TableCell className="text-right">{item.signedQuotations}</TableCell>
                <TableCell className="text-right font-bold">{item.projectedStock}</TableCell>
                <TableCell className="text-center">
                  <Badge className={stockStatus.color}>
                    {stockStatus.label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
