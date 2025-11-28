import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { useInventoryItems } from '@/hooks/useInventory';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const calculateStockDaysLeft = (projectedStock: number, consumed30d: number) => {
    if (consumed30d === 0) return Infinity;
    const dailyConsumption = consumed30d / 30;
    return Math.round(projectedStock / dailyConsumption);
};

export const InventoryOverview = () => {
    const navigate = useNavigate();
    const { data: products, isLoading } = useInventoryItems();
    
    const handleLowStockClick = () => {
        navigate('/products?tab=stock&stock=reorder');
    };
    
    const handleCriticalClick = () => {
        navigate('/products?tab=stock&stock=critical');
    };
    
    const handleActiveProductsClick = () => {
        navigate('/products?tab=stock');
    };

    // Calculate metrics from products
    const metrics = useMemo(() => {
        if (!products || products.length === 0) {
            return {
                totalInventoryValue: 0,
                lowStockCount: 0,
                criticalCount: 0,
                activeProductsCount: 0,
                categoriesCount: 0,
            };
        }

        let totalInventoryValue = 0;
        let lowStockCount = 0;
        let criticalCount = 0;
        const categories = new Set<string>();

        products.forEach((product) => {
            // Calculate inventory value (in_stock * supply_price or unit_cost)
            const price = product.supply_price ?? product.unit_cost ?? 0;
            totalInventoryValue += product.in_stock * price;

            // Count categories
            if (product.pm_category) {
                categories.add(product.pm_category);
            }

            // Calculate stock status
            const daysLeft = calculateStockDaysLeft(product.projected_stock, product.consumed_30d);
            
            if (daysLeft < 15) {
                criticalCount++;
            } else if (daysLeft >= 15 && daysLeft < 30) {
                lowStockCount++;
            }
        });

        return {
            totalInventoryValue,
            lowStockCount,
            criticalCount,
            activeProductsCount: products.length,
            categoriesCount: categories.size,
        };
    }, [products]);

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-24 mb-2" />
                                <Skeleton className="h-3 w-40" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group relative p-6 transition-all duration-300 overflow-hidden border-border/50 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30">
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground/80 mb-2.5 tracking-wide uppercase">
                                    Total Inventory Value
                                </p>
                                <h3 className="text-3xl font-bold text-foreground tracking-tight">
                                    RM {metrics.totalInventoryValue.toLocaleString('en-US', { 
                                        minimumFractionDigits: 2, 
                                        maximumFractionDigits: 2 
                                    })}
                                </h3>
                            </div>
                            
                            {/* Icon with colored background */}
                            <div className="bg-primary p-3.5 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl">
                                <DollarSign className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-4">
                            Based on current stock levels
                        </p>
                    </div>
                </Card>
                
                <Card 
                    className={cn(
                        "group relative p-6 transition-all duration-300 overflow-hidden border-border/50",
                        "hover:shadow-2xl hover:shadow-yellow-500/10 hover:border-yellow-500/30",
                        "cursor-pointer hover:scale-[1.02]"
                    )}
                    onClick={handleLowStockClick}
                >
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground/80 mb-2.5 tracking-wide uppercase">
                                    Low Stock Items
                                </p>
                                <h3 className="text-3xl font-bold text-foreground tracking-tight">
                                    {metrics.lowStockCount}
                                </h3>
                            </div>
                            
                            {/* Icon with colored background */}
                            <div className="bg-yellow-500 p-3.5 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-4">
                            Requires attention
                        </p>
                    </div>
                </Card>
                
                <Card 
                    className={cn(
                        "group relative p-6 transition-all duration-300 overflow-hidden border-border/50",
                        "hover:shadow-2xl hover:shadow-destructive/10 hover:border-destructive/30",
                        "cursor-pointer hover:scale-[1.02]"
                    )}
                    onClick={handleCriticalClick}
                >
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground/80 mb-2.5 tracking-wide uppercase">
                                    Critical Items
                                </p>
                                <h3 className="text-3xl font-bold text-foreground tracking-tight">
                                    {metrics.criticalCount}
                                </h3>
                            </div>
                            
                            {/* Icon with colored background */}
                            <div className="bg-destructive p-3.5 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-4">
                            Stockout risk high
                        </p>
                    </div>
                </Card>
                
                <Card 
                    className={cn(
                        "group relative p-6 transition-all duration-300 overflow-hidden border-border/50",
                        "hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30",
                        "cursor-pointer hover:scale-[1.02]"
                    )}
                    onClick={handleActiveProductsClick}
                >
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground/80 mb-2.5 tracking-wide uppercase">
                                    Active Products
                                </p>
                                <h3 className="text-3xl font-bold text-foreground tracking-tight">
                                    {metrics.activeProductsCount}
                                </h3>
                            </div>
                            
                            {/* Icon with colored background */}
                            <div className="bg-primary p-3.5 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl">
                                <Package className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-4">
                            Across {metrics.categoriesCount} {metrics.categoriesCount === 1 ? 'category' : 'categories'}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Placeholder for Charts/Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Inventory Movement</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                            Chart Placeholder (Stock Levels over Time)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                            Activity feed coming soon
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
