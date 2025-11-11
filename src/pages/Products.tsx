import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TopHeader } from '@/components/TopHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, Search } from 'lucide-react';
import { useInventoryItems } from '@/hooks/useInventory';
import { Skeleton } from '@/components/ui/skeleton';

const Products = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: products, isLoading } = useInventoryItems();

  const filteredProducts = products?.filter(
    (product) =>
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Products"
        description="Manage your product catalog and vendor relationships"
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Product Name</TableHead>
                    <TableHead className="font-semibold">SKU</TableHead>
                    <TableHead className="font-semibold text-right">In Stock</TableHead>
                    <TableHead className="font-semibold text-right">Available</TableHead>
                    <TableHead className="font-semibold text-right">Unit Cost</TableHead>
                    <TableHead className="font-semibold text-right">Safety Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const available = product.in_stock - product.allocated;
                    const isLowStock = available < product.safety_stock;

                    return (
                      <TableRow
                        key={product.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {product.product_name}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {product.sku}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {product.in_stock}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={isLowStock ? 'text-destructive font-bold' : 'font-medium'}>
                              {available}
                            </span>
                            {isLowStock && (
                              <Badge variant="destructive" className="text-xs">
                                Low
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${product.unit_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {product.safety_stock}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Your product catalog is empty'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
