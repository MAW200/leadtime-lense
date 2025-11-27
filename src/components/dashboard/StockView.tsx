import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryTable } from '@/components/dashboard/InventoryTable';
import { ProductMasterRow } from '@/components/dashboard/ProductMasterRow';
import { Search, Filter, AlertTriangle, TrendingUp, Package2, Plus } from 'lucide-react';
import { useInventoryItems } from '@/hooks/useInventory';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryItem, MasterProduct } from '@/lib/supabase';
import { useQueryParam } from '@/hooks/useQueryParam';

interface StockViewProps {
    onRowClick: (item: InventoryItem) => void;
    onCreateMaster: () => void;
    onAddVariant: (masterId: string) => void;
}

export const StockView = ({ onRowClick, onCreateMaster, onAddVariant }: StockViewProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'critical' | 'reorder' | 'healthy' | null>(null);
    const [stockFilterParam, setStockFilterParam] = useQueryParam('stock');
    useEffect(() => {
        if (!stockFilterParam) {
            setFilterStatus(null);
            return;
        }
        if (stockFilterParam === 'critical' || stockFilterParam === 'reorder' || stockFilterParam === 'healthy') {
            setFilterStatus(stockFilterParam);
        }
    }, [stockFilterParam]);

    const toggleFilter = (status: 'critical' | 'reorder' | 'healthy') => {
        setFilterStatus((prev) => {
            const next = prev === status ? null : status;
            setStockFilterParam(next);
            return next;
        });
    };


    const { data: products, isLoading, error } = useInventoryItems();

    const calculateStockDaysLeft = (projectedStock: number, consumed30d: number) => {
        if (consumed30d === 0) return Infinity;
        const dailyConsumption = consumed30d / 30;
        return Math.round(projectedStock / dailyConsumption);
    };

    // 1. Filter variants first based on search and status
    const filteredVariants = useMemo(() => {
        if (!products) return [];

        return products.filter((product) => {
            // Search Filter
            const matchesSearch =
                product?.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product?.master_product?.name.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            // Status Filter
            if (!filterStatus) return true;

            const daysLeft = calculateStockDaysLeft(product.projected_stock, product.consumed_30d);

            if (filterStatus === 'critical') return daysLeft < 15;
            if (filterStatus === 'reorder') return daysLeft >= 15 && daysLeft < 30;
            if (filterStatus === 'healthy') return daysLeft >= 30;

            return true;
        });
    }, [products, searchQuery, filterStatus]);

    // 2. Group filtered variants by Master Product
    const { masterGroups, orphans } = useMemo(() => {
        const groups: Record<string, { master: MasterProduct; variants: InventoryItem[] }> = {};
        const orphanItems: InventoryItem[] = [];

        filteredVariants.forEach((item) => {
            if (item.master_product) {
                const masterId = item.master_product.id;
                if (!groups[masterId]) {
                    groups[masterId] = {
                        master: item.master_product,
                        variants: [],
                    };
                }
                groups[masterId].variants.push(item);
            } else {
                orphanItems.push(item);
            }
        });

        return { masterGroups: Object.values(groups), orphans: orphanItems };
    }, [filteredVariants]);

    const criticalCount = products?.filter(item => {
        const daysLeft = calculateStockDaysLeft(item.projected_stock, item.consumed_30d);
        return daysLeft < 15;
    }).length || 0;

    const lowStockCount = products?.filter(item => {
        const daysLeft = calculateStockDaysLeft(item.projected_stock, item.consumed_30d);
        return daysLeft >= 15 && daysLeft < 30;
    }).length || 0;

    const healthyCount = (products?.length || 0) - criticalCount - lowStockCount;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card border-destructive">
                    <Package2 className="h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Error loading products</h3>
                    <p className="text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : 'Failed to load products'}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Search and Quick Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products by name or SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Quick Filter Buttons */}
                        <div className="flex gap-2">
                            <Button
                                variant={filterStatus === 'critical' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleFilter('critical')}
                                className={filterStatus === 'critical' ? 'bg-destructive hover:bg-destructive/90' : ''}
                            >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Critical ({criticalCount})
                            </Button>
                            <Button
                                variant={filterStatus === 'reorder' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleFilter('reorder')}
                                className={filterStatus === 'reorder' ? 'bg-warning hover:bg-warning/90' : ''}
                            >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Low Stock ({lowStockCount})
                            </Button>
                            <Button
                                variant={filterStatus === 'healthy' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleFilter('healthy')}
                                className={filterStatus === 'healthy' ? 'bg-success hover:bg-success/90' : ''}
                            >
                                <Package2 className="h-4 w-4 mr-2" />
                                Healthy ({healthyCount})
                            </Button>
                        </div>

                        <div className="ml-auto">
                            <Button variant="default" size="sm" onClick={onCreateMaster}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Product
                            </Button>
                        </div>
                    </div>

                    {/* Inventory List */}
                    {(masterGroups.length > 0 || orphans.length > 0) ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Click any row to view detailed supply chain information
                                    </p>
                                    {filterStatus && (
                                        <p className="text-sm font-medium text-primary mt-2">
                                            Filtering by: {filterStatus === 'critical' ? 'Critical' : filterStatus === 'reorder' ? 'Low Stock' : 'Healthy'} items
                                            <button
                                                onClick={() => setFilterStatus(null)}
                                                className="ml-2 text-xs underline hover:no-underline"
                                            >
                                                Clear filter
                                            </button>
                                        </p>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Showing {filteredVariants.length} variants
                                </p>
                            </div>

                            {/* Master Groups */}
                            {masterGroups.map((group) => (
                                <ProductMasterRow
                                    key={group.master.id}
                                    masterProduct={group.master}
                                    variants={group.variants}
                                    onRowClick={onRowClick}
                                    filterStatus={filterStatus}
                                    onAddVariant={onAddVariant}
                                />
                            ))}

                            {/* Orphan Items (Legacy or Uncategorized) */}
                            {orphans.length > 0 && (
                                <div className="space-y-4">
                                    {masterGroups.length > 0 && (
                                        <h3 className="text-lg font-semibold text-muted-foreground">Uncategorized Products</h3>
                                    )}
                                    <InventoryTable
                                        data={orphans}
                                        filterStatus={filterStatus}
                                        onRowClick={onRowClick}
                                    />
                                </div>
                            )}

                            {/* Status Legend */}
                            <div className="flex items-center gap-6 p-4 bg-card rounded-lg border">
                                <p className="text-sm font-medium text-muted-foreground">Status Legend:</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-success"></div>
                                    <span className="text-sm">Healthy ({'>'}  30 days)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-warning"></div>
                                    <span className="text-sm">Re-order (15-30 days)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-destructive"></div>
                                    <span className="text-sm">Critical ({'<'} 15 days)</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
                            <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No products found</h3>
                            <p className="text-sm text-muted-foreground">
                                {searchQuery || filterStatus
                                    ? 'Try adjusting your search or filters'
                                    : 'Your product catalog is empty'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
