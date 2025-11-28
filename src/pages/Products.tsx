import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TopHeader } from '@/components/navigation/TopHeader';
import { CreateProductModal } from '@/components/modals/CreateProductModal';
import { InventoryOverview } from '@/components/dashboard/InventoryOverview';
import { StockView } from '@/components/dashboard/StockView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryItem } from '@/lib/supabase';
import { useInventoryItems } from '@/hooks/useInventory';

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products } = useInventoryItems();

  // Get active tab from URL query param, default to 'overview'
  const activeTab = searchParams.get('tab') || 'overview';
  
  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'create_master' | 'add_variant'>('create_master');
  const [selectedMasterId, setSelectedMasterId] = useState<string | undefined>(undefined);

  // Handle tab change
  const handleTabChange = (value: string) => {
    if (value === 'overview') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleRowClick = (item: InventoryItem) => {
    // Get current URL params to preserve state (tab, page, search, stock filter)
    const currentParams = new URLSearchParams(window.location.search);
    // Ensure tab=stock is in the params
    if (!currentParams.has('tab')) {
      currentParams.set('tab', 'stock');
    }
    // Get the master product name to expand on return
    const masterProductName = item.master_product?.name || item.product_name;
    // Add expand param to preserve which master product should be expanded
    currentParams.set('expand', masterProductName);
    // Navigate to product detail page with state to preserve tab, filters, page, and product info
    navigate(`/products/${item.id}`, {
      state: { 
        returnTo: 'stock',
        returnUrl: `/products?${currentParams.toString()}`,
        productId: item.id,
        productName: item.product_name,
        masterProductName: masterProductName
      }
    });
  };

  const handleCreateMaster = () => {
    setCreateMode('create_master');
    setSelectedMasterId(undefined);
    setIsCreateModalOpen(true);
  };

  const handleAddVariant = (masterId: string) => {
    setCreateMode('add_variant');
    setSelectedMasterId(masterId);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Products"
        description="Manage your product catalog and inventory levels"
      />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stock">Stock View</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <InventoryOverview />
          </TabsContent>

          <TabsContent value="stock">
            <StockView
              onRowClick={handleRowClick}
              onCreateMaster={handleCreateMaster}
              onAddVariant={handleAddVariant}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode={createMode}
        preSelectedMasterId={selectedMasterId}
      />
    </div>
  );
};

export default Products;
