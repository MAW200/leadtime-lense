import { useState } from 'react';
import { TopHeader } from '@/components/navigation/TopHeader';
import { ProductDetailPanel } from '@/components/dashboard/ProductDetailPanel';
import { CreateProductModal } from '@/components/modals/CreateProductModal';
import { InventoryOverview } from '@/components/dashboard/InventoryOverview';
import { StockView } from '@/components/dashboard/StockView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryItem } from '@/lib/supabase';
import { useQueryParam } from '@/hooks/useQueryParam';
import { useInventoryItems } from '@/hooks/useInventory';
import { useEffect } from 'react';

const Products = () => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [productIdParam, setProductIdParam] = useQueryParam('product_id');
  const { data: products } = useInventoryItems();

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'create_master' | 'add_variant'>('create_master');
  const [selectedMasterId, setSelectedMasterId] = useState<string | undefined>(undefined);

  // Deep Linking Effect
  useEffect(() => {
    if (productIdParam && products) {
      const item = products.find((p) => p.id === productIdParam);
      if (item) {
        setSelectedItem(item);
        setIsPanelOpen(true);
      }
    } else if (!productIdParam) {
      // If param is removed (e.g. back button), close panel
      setIsPanelOpen(false);
      setSelectedItem(null);
    }
  }, [productIdParam, products]);

  const handleRowClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsPanelOpen(true);
    setProductIdParam(item.id);
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
        <Tabs defaultValue="overview" className="space-y-6">
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

      <ProductDetailPanel
        item={selectedItem}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedItem(null);
          setProductIdParam(null);
        }}
      />

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
