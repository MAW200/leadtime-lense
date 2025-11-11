import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Search, Plus } from 'lucide-react';
import { useInventoryItems } from '@/hooks/useInventory';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/PageHeader';
import { OnsiteRequestModal } from '@/components/OnsiteRequestModal';
import { InventoryItem } from '@/lib/supabase';

const OnsiteBrowse = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

  const { data: products, isLoading } = useInventoryItems();

  const handleProductClick = (product: InventoryItem) => {
    setSelectedProduct(product);
    setIsRequestModalOpen(true);
  };

  const handleNewRequest = () => {
    setSelectedProduct(null);
    setIsRequestModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRequestModalOpen(false);
    setSelectedProduct(null);
  };

  const filteredProducts = products?.filter(
    (product) =>
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAvailableQty = (product: typeof products[0]) => {
    return product.in_stock - product.allocated;
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Browse Inventory"
        description="Click any item to create a request"
        actions={
          <Button onClick={handleNewRequest}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const available = getAvailableQty(product);
                const isLowStock = available < product.safety_stock;
                const isOutOfStock = available === 0;

                return (
                  <Card
                    key={product.id}
                    className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                      isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    onClick={() => !isOutOfStock && handleProductClick(product)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{product.product_name}</CardTitle>
                          <CardDescription className="mt-1">
                            SKU: {product.sku}
                          </CardDescription>
                        </div>
                        {isOutOfStock && (
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        )}
                        {!isOutOfStock && isLowStock && (
                          <Badge variant="secondary" className="text-xs bg-yellow-500 text-white">
                            Low Stock
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm text-muted-foreground">Available</span>
                          <span className={`text-2xl font-bold ${
                            isOutOfStock ? 'text-destructive' :
                            isLowStock ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {available}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">In Stock:</span>
                            <span className="ml-2 font-medium">{product.in_stock}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Allocated:</span>
                            <span className="ml-2 font-medium">{product.allocated}</span>
                          </div>
                        </div>
                        {!isOutOfStock && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-center text-muted-foreground">
                              Click to claim this item
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'No products available in inventory'}
              </p>
            </div>
          )}
        </div>
      </div>

      <OnsiteRequestModal
        isOpen={isRequestModalOpen}
        onClose={handleCloseModal}
        prefilledProduct={selectedProduct}
      />
    </div>
  );
};

export default OnsiteBrowse;
