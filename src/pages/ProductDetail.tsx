import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TopHeader } from '@/components/navigation/TopHeader';
import { useInventoryItems } from '@/hooks/useInventory';
import { Skeleton } from '@/components/ui/skeleton';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: products, isLoading } = useInventoryItems();
  
  // Get return state from navigation
  const returnState = location.state as { 
    returnTo?: string; 
    returnUrl?: string;
    productId?: string;
    productName?: string;
  } | null;

  const product = useMemo(() => {
    if (!products || !id) return null;
    return products.find((p) => p.id === id);
  }, [products, id]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <TopHeader title="Product Details" />
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-full flex flex-col">
        <TopHeader title="Product Not Found" />
        <div className="flex-1 overflow-y-auto px-8 py-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Product not found</p>
            <Button onClick={() => navigate('/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title={product.product_name}
        description={`SKU: ${product.sku}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Navigate back to products page, preserving previous state
              if (returnState?.returnUrl) {
                navigate(returnState.returnUrl, { replace: false });
              } else {
                // Fallback to stock tab if no return URL
                navigate('/products?tab=stock', { replace: false });
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="flex-1 overflow-hidden px-6 py-4">
        <div className="h-full grid grid-cols-3 gap-3">
          {/* Left Column - Basic Information */}
          <div className="space-y-3">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Product Name</p>
                  <p className="font-semibold text-sm">{product.product_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">SKU</p>
                  <p className="font-mono text-sm">{product.sku}</p>
                </div>
                {product.supplier_name && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Supplier Name</p>
                    <p className="font-semibold text-sm">{product.supplier_name}</p>
                  </div>
                )}
                {product.pm_category && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Category</p>
                    <p className="font-semibold text-sm">{product.pm_category}</p>
                  </div>
                )}
                {product.type && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Type</p>
                    <p className="font-semibold text-sm">{product.type}</p>
                  </div>
                )}
                {product.uom && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Unit of Measure</p>
                    <p className="font-semibold text-sm">{product.uom}</p>
                  </div>
                )}
                {(product.status !== undefined && product.status !== null) && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                    <Badge variant={product.status === 'available' ? 'default' : 'outline'} className="text-xs">
                      {product.status || 'N/A'}
                    </Badge>
                  </div>
                )}
                {product.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Description</p>
                    <p className="text-xs line-clamp-3">{product.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Physical Attributes */}
          <div className="space-y-3">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Physical Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Color</p>
                    <p className="font-semibold text-sm">{product.color || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Material</p>
                    <p className="font-semibold text-sm">{product.material || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Width</p>
                    <p className="font-semibold text-sm">{product.width || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Height</p>
                    <p className="font-semibold text-sm">{product.height || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Depth</p>
                    <p className="font-semibold text-sm">{product.depth || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {product.attachments && (
              <Card className="h-auto">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs line-clamp-2">{product.attachments}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Pricing & Stock Information */}
          <div className="space-y-3">
            <Card className="h-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Pricing (RM)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {product.supply_price !== undefined && product.supply_price !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Supply Price</p>
                    <p className="text-lg font-bold">{product.supply_price}</p>
                  </div>
                )}
                {product.install_price !== undefined && product.install_price !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Install Price</p>
                    <p className="text-lg font-bold">{product.install_price}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(product.in_stock !== undefined || product.allocated !== undefined || product.projected_stock !== undefined) && (
              <Card className="h-auto">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Stock Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {product.in_stock !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">In Stock</p>
                      <p className="text-xl font-bold">{product.in_stock}</p>
                    </div>
                  )}
                  {product.allocated !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Allocated</p>
                      <p className="text-xl font-bold">{product.allocated}</p>
                    </div>
                  )}
                  {product.projected_stock !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Projected Stock</p>
                      <p className="text-xl font-bold">{product.projected_stock}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

