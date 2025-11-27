import { useState } from 'react';
import { ChevronDown, ChevronRight, Package, Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { InventoryItem, MasterProduct } from '@/lib/supabase';
import { InventoryTable } from './InventoryTable';

interface ProductMasterRowProps {
    masterProduct: MasterProduct;
    variants: InventoryItem[];
    onRowClick: (item: InventoryItem) => void;
    filterStatus: 'critical' | 'reorder' | 'healthy' | null;
    onAddVariant: (masterId: string) => void;
}

export const ProductMasterRow = ({
    masterProduct,
    variants,
    onRowClick,
    filterStatus,
    onAddVariant,
}: ProductMasterRowProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate aggregate stats
    const totalStock = variants.reduce((sum, v) => sum + v.in_stock, 0);
    const totalProjected = variants.reduce((sum, v) => sum + v.projected_stock, 0);
    const variantCount = variants.length;

    // Determine status based on worst-case variant
    const getVariantStatus = (item: InventoryItem) => {
        if (item.consumed_30d === 0) return 'healthy';
        const dailyConsumption = item.consumed_30d / 30;
        const daysLeft = item.projected_stock / dailyConsumption;
        if (daysLeft < 15) return 'critical';
        if (daysLeft < 30) return 'reorder';
        return 'healthy';
    };

    const hasCritical = variants.some((v) => getVariantStatus(v) === 'critical');
    const hasReorder = variants.some((v) => getVariantStatus(v) === 'reorder');

    return (
        <div className="border rounded-lg mb-4 overflow-hidden bg-card transition-all duration-200 shadow-sm hover:shadow-md">
            {/* Master Row Header */}
            <div
                className={cn(
                    "flex items-center p-4 cursor-pointer hover:bg-accent/50 transition-colors",
                    isExpanded && "bg-accent/30"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="mr-4">
                    {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                </div>

                <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                    {/* Product Info */}
                    <div className="col-span-5 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base">{masterProduct.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{variantCount} {variantCount === 1 ? 'Variant' : 'Variants'}</span>
                                {variants.some(v => v.product_vendors?.some(pv => pv.is_primary)) && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            {variants.find(v => v.product_vendors?.some(pv => pv.is_primary))?.product_vendors?.find(pv => pv.is_primary)?.vendor.name}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Aggregate Stats */}
                    <div className="col-span-3">
                        <div className="text-sm text-muted-foreground">Total Stock</div>
                        <div className="font-medium">{totalStock} units</div>
                    </div>

                    <div className="col-span-3">
                        <div className="text-sm text-muted-foreground">Projected</div>
                        <div className="font-medium">{totalProjected} units</div>
                    </div>

                    {/* Status Badge */}
                    <div className="col-span-1 flex justify-end">
                        {hasCritical ? (
                            <Badge variant="destructive" className="animate-pulse">Critical</Badge>
                        ) : hasReorder ? (
                            <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25">Low Stock</Badge>
                        ) : (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Healthy</Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Variants Table */}
            {isExpanded && (
                <div className="border-t bg-muted/30 p-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Product Variants</h4>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddVariant(masterProduct.id);
                            }}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Variant
                        </Button>
                    </div>

                    <div className="bg-background rounded-md border overflow-hidden">
                        <InventoryTable
                            data={variants}
                            filterStatus={filterStatus}
                            onRowClick={onRowClick}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
