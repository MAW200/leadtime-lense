import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryTable } from '@/components/dashboard/InventoryTable';
import { ProductMasterRow } from '@/components/dashboard/ProductMasterRow';
import { Search, Filter, AlertTriangle, TrendingUp, Package2, Plus, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
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
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [filterStatus, setFilterStatus] = useState<'critical' | 'reorder' | 'healthy' | null>(null);
    const [stockFilterParam, setStockFilterParam] = useQueryParam('stock');
    const pageParam = searchParams.get('page');
    const [currentPage, setCurrentPage] = useState(pageParam ? parseInt(pageParam, 10) : 1);
    const itemsPerPage = 10;
    
    // Track which master product should be expanded (from navigation state or URL param)
    const expandMasterParam = searchParams.get('expand');
    const locationState = location.state as { masterProductName?: string } | null;
    const [expandedMasterId, setExpandedMasterId] = useState<string | null>(
        expandMasterParam || (locationState?.masterProductName ? locationState.masterProductName : null)
    );
    
    // Sync expanded master from URL param
    useEffect(() => {
        const expandParam = searchParams.get('expand');
        if (expandParam) {
            setExpandedMasterId(expandParam);
        } else if (!locationState?.masterProductName) {
            // Only clear if not coming from navigation state
            setExpandedMasterId(null);
        }
    }, [searchParams.get('expand'), locationState]);
    
    // Sync search query with URL when URL changes (e.g., back navigation)
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        if (urlSearch !== searchQuery) {
            setSearchQuery(urlSearch);
        }
    }, [searchParams.get('search')]);
    
    // Sync page with URL when URL changes (e.g., back navigation)
    useEffect(() => {
        const urlPage = searchParams.get('page');
        if (urlPage) {
            const pageNum = parseInt(urlPage, 10);
            if (!isNaN(pageNum) && pageNum !== currentPage) {
                setCurrentPage(pageNum);
            }
        } else if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [searchParams.get('page')]);
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

    // Helper function to sort alphabetically with numbers first
    const sortAlphabetically = (a: string, b: string): number => {
        const aStartsWithNumber = /^\d/.test(a);
        const bStartsWithNumber = /^\d/.test(b);
        
        // Numbers first
        if (aStartsWithNumber && !bStartsWithNumber) return -1;
        if (!aStartsWithNumber && bStartsWithNumber) return 1;
        
        // Both numbers or both letters - sort alphabetically
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
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

    // 2. Group filtered variants by product_name (Master Product)
    const { masterGroups, orphans } = useMemo(() => {
        const groups: Record<string, { master: { id: string; name: string; description: string | null }; variants: InventoryItem[] }> = {};
        const orphanItems: InventoryItem[] = [];

        filteredVariants.forEach((item) => {
            const productName = item.product_name || 'Unnamed Product';
            
            // Group by product_name
            if (!groups[productName]) {
                const now = new Date().toISOString();
                groups[productName] = {
                    master: {
                        id: `master-${productName}`,
                        name: productName,
                        description: item.description || null,
                        created_at: now,
                        updated_at: now,
                    },
                    variants: [],
                };
            }
            groups[productName].variants.push(item);
        });

        // Sort variants within each group by SKU
        Object.values(groups).forEach(group => {
            group.variants.sort((a, b) => {
                const skuA = a.sku || '';
                const skuB = b.sku || '';
                return sortAlphabetically(skuA, skuB);
            });
        });

        // Sort master groups alphabetically (numbers first)
        const sortedGroups = Object.values(groups).sort((a, b) => 
            sortAlphabetically(a.master.name, b.master.name)
        );

        return { masterGroups: sortedGroups, orphans: orphanItems };
    }, [filteredVariants]);

    // 3. Pagination
    const totalPages = Math.ceil(masterGroups.length / itemsPerPage);
    const paginatedGroups = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return masterGroups.slice(startIndex, endIndex);
    }, [masterGroups, currentPage, itemsPerPage]);

    // Update URL params when search or page changes (only if different from URL)
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        const urlPage = searchParams.get('page');
        const urlPageNum = urlPage ? parseInt(urlPage, 10) : 1;
        
        // Only update URL if state differs from URL (user action, not URL sync)
        const searchChanged = (searchQuery || '') !== urlSearch;
        const pageChanged = currentPage !== urlPageNum;
        
        if (searchChanged || pageChanged) {
            const newParams = new URLSearchParams(searchParams);
            if (searchQuery) {
                newParams.set('search', searchQuery);
            } else {
                newParams.delete('search');
            }
            if (currentPage > 1) {
                newParams.set('page', currentPage.toString());
            } else {
                newParams.delete('page');
            }
            setSearchParams(newParams, { replace: true });
        }
    }, [searchQuery, currentPage, searchParams, setSearchParams]);
    
    // Reset to page 1 when filter changes
    useEffect(() => {
        if (filterStatus !== null && currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [filterStatus]);

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
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    // Reset to page 1 on new search
                                    setCurrentPage(1);
                                }}
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
                                className={filterStatus === 'healthy' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
                            >
                                <Package2 className="h-4 w-4 mr-2" />
                                Healthy ({healthyCount})
                            </Button>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            {filterStatus && (
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                        setFilterStatus(null);
                                        setStockFilterParam(null);
                                    }}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                            )}
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
                                    Showing {masterGroups.length} master products ({filteredVariants.length} total variants)
                                </p>
                            </div>

                            {/* Master Groups - Paginated */}
                            {paginatedGroups.map((group) => (
                                <ProductMasterRow
                                    key={group.master.id}
                                    masterProduct={group.master}
                                    variants={group.variants}
                                    onRowClick={onRowClick}
                                    filterStatus={filterStatus}
                                    onAddVariant={onAddVariant}
                                    expanded={expandedMasterId === group.master.name || expandedMasterId === group.master.id}
                                    onExpandedChange={(expanded) => {
                                        if (expanded) {
                                            setExpandedMasterId(group.master.name);
                                            // Update URL param
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.set('expand', group.master.name);
                                            setSearchParams(newParams, { replace: true });
                                        } else {
                                            setExpandedMasterId(null);
                                            // Remove URL param
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.delete('expand');
                                            setSearchParams(newParams, { replace: true });
                                        }
                                    }}
                                />
                            ))}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages} ({masterGroups.length} total products)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={currentPage === pageNum ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="w-10"
                                                        onClick={() => setCurrentPage(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}

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
                                    <div className="w-4 h-4 rounded bg-green-500"></div>
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
