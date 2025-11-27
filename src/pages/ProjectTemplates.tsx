import { useMemo, useState } from 'react';
import { TopHeader } from '@/components/navigation/TopHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  FileStack,
  MoreVertical,
  Layers,
  Package,
  Trash2,
  Copy,
  Pencil,
} from 'lucide-react';
import { useInventoryItems } from '@/hooks/useInventory';
import {
  useCreateTemplate,
  useCreateTemplateItem,
  useDeleteTemplate,
  useDeleteTemplateItem,
  useDuplicateTemplate,
  useProjectTemplate,
  useProjectTemplates,
  useUpdateTemplate,
  useUpdateTemplateItem,
} from '@/hooks/useProjectTemplates';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { ProjectTemplateWithItems } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const PHASE_OPTIONS = [
  { value: 'P1', label: 'Phase 1' },
  { value: 'P2a', label: 'Phase 2A' },
  { value: 'P2b', label: 'Phase 2B' },
] as const;

type PhaseValue = (typeof PHASE_OPTIONS)[number]['value'];

const groupItemsByPhase = (template?: ProjectTemplateWithItems | null) => {
  if (!template || !template.project_template_items) return {};
  return template.project_template_items.reduce<Record<PhaseValue, typeof template.project_template_items>>((acc, item) => {
    const phase = item.phase as PhaseValue;
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(item);
    return acc;
  }, {} as Record<PhaseValue, typeof template.project_template_items>);
};

const ProjectTemplates = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const { data: templates, isLoading, isFetching } = useProjectTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const duplicateTemplate = useDuplicateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const { data: detailTemplate, isLoading: isDetailLoading } = useProjectTemplate(selectedTemplateId || undefined);
  const { data: inventoryItems } = useInventoryItems();

  const phaseGroups = useMemo(() => groupItemsByPhase(detailTemplate), [detailTemplate]);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemPhase, setItemPhase] = useState<PhaseValue>('P1');
  const [itemProductId, setItemProductId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const createTemplateItem = useCreateTemplateItem();
  const updateTemplateItem = useUpdateTemplateItem();
  const deleteTemplateItem = useDeleteTemplateItem();

  const resetTemplateForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setEditingTemplateId(null);
    setIsCreateModalOpen(false);
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Template name is required');
      return;
    }

    try {
      if (editingTemplateId) {
        await updateTemplate.mutateAsync({
          id: editingTemplateId,
          name: templateName,
          description: templateDescription || null,
        });
        toast.success('Template updated');
      } else {
        await createTemplate.mutateAsync({
          name: templateName,
          description: templateDescription || null,
        });
        toast.success('Template created');
      }
      resetTemplateForm();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save template');
    }
  };

  const handleOpenDetail = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsDetailOpen(true);
  };

  const handleDuplicate = async (template: ProjectTemplateWithItems) => {
    try {
      await duplicateTemplate.mutateAsync(template);
      toast.success('Template duplicated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleDeleteTemplate = async (template: ProjectTemplateWithItems) => {
    try {
      await deleteTemplate.mutateAsync(template.id);
      toast.success('Template deleted');
      if (selectedTemplateId === template.id) {
        setIsDetailOpen(false);
        setSelectedTemplateId(null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete template');
    }
  };

  const openCreateModal = (template?: ProjectTemplateWithItems) => {
    if (template) {
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      setEditingTemplateId(template.id);
    } else {
      setTemplateName('');
      setTemplateDescription('');
      setEditingTemplateId(null);
    }
    setIsCreateModalOpen(true);
  };

  const openItemModal = (phase: PhaseValue, itemId?: string) => {
    setItemPhase(phase);
    if (itemId) {
      const existing = detailTemplate?.project_template_items?.find(i => i.id === itemId);
      if (existing) {
        setItemProductId(existing.product_id);
        setItemQuantity(existing.required_quantity);
        setEditingItemId(existing.id);
      }
    } else {
      setItemProductId('');
      setItemQuantity(1);
      setEditingItemId(null);
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!detailTemplate?.id) return;
    if (!itemProductId) {
      toast.error('Please select a product');
      return;
    }
    if (itemQuantity <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    try {
      if (editingItemId) {
        await updateTemplateItem.mutateAsync({
          id: editingItemId,
          template_id: detailTemplate.id,
          phase: itemPhase,
          required_quantity: itemQuantity,
        });
        toast.success('Template item updated');
      } else {
        await createTemplateItem.mutateAsync({
          template_id: detailTemplate.id,
          product_id: itemProductId,
          phase: itemPhase,
          required_quantity: itemQuantity,
        });
        toast.success('Product added to template');
      }
      setIsItemModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save template item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!detailTemplate) return;
    try {
      await deleteTemplateItem.mutateAsync({ id: itemId, template_id: detailTemplate.id });
      toast.success('Template item removed');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove template item');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Project Templates"
        description="Standardize project setup with reusable Bill of Materials templates"
        actions={
          <Button onClick={() => openCreateModal()}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {isLoading || isFetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <Skeleton key={idx} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {templates.map(template => {
              const productCount = template.project_template_items?.length ?? 0;
              const phasesCovered = new Set(template.project_template_items?.map(item => item.phase));

              return (
                <Card key={template.id} className="border border-muted hover:border-primary/60 transition-colors">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-base font-semibold">{template.name}</CardTitle>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openCreateModal(template)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Template
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteTemplate(template)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4 text-primary" />
                        Products in BOM
                      </div>
                      <span className="text-lg font-semibold">{productCount}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PHASE_OPTIONS.filter(option => phasesCovered.has(option.value)).length > 0 ? (
                        PHASE_OPTIONS.filter(option => phasesCovered.has(option.value)).map(option => (
                          <Badge key={option.value} variant="secondary" className="rounded-md px-2.5 py-1 text-xs">
                            {option.label}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          No phases assigned
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center pt-0">
                    <Button variant="outline" size="sm" onClick={() => openCreateModal(template)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => handleOpenDetail(template.id)}>
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
            <FileStack className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Create your first project template to standardize Bill of Materials across similar projects.
            </p>
            <Button onClick={() => openCreateModal()}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplateId ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              {editingTemplateId
                ? 'Update the template details below.'
                : 'Define a standardized Bill of Materials for future projects.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template-name"
                placeholder="e.g., Modern Condo Template"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Input
                id="template-description"
                placeholder="Optional details about this template"
                value={templateDescription}
                onChange={(event) => setTemplateDescription(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetTemplateForm}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending || updateTemplate.isPending}>
              {(createTemplate.isPending || updateTemplate.isPending) ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-[480px] sm:w-[580px] p-0">
          <SheetHeader className="px-6 py-6 border-b">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Layers className="h-5 w-5 text-primary" />
              {detailTemplate?.name || 'Template Details'}
            </SheetTitle>
            {detailTemplate?.description && (
              <SheetDescription>{detailTemplate.description}</SheetDescription>
            )}
          </SheetHeader>
          <ScrollArea className="h-full">
            <div className="px-6 py-6 space-y-8">
              {isDetailLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, idx) => (
                    <Skeleton key={idx} className="h-32 w-full rounded-xl" />
                  ))}
                </div>
              ) : detailTemplate ? (
                <>
                  {PHASE_OPTIONS.map(phase => {
                    const items = phaseGroups[phase.value] || [];
                    return (
                      <div key={phase.value} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            {phase.label}
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openItemModal(phase.value)}
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Product
                          </Button>
                        </div>

                        {items.length > 0 ? (
                          <div className="space-y-3">
                            {items.map(item => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {item.product?.product_name || 'Unnamed Product'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    SKU: {item.product?.sku || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Qty: {item.required_quantity}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openItemModal(phase.value, item.id)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
                            No products assigned to this phase yet.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Template not found.</div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItemId ? 'Update Template Item' : 'Add Product to Template'}</DialogTitle>
            <DialogDescription>
              Select a product and assign the required quantity for this phase.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Phase</Label>
              <Select value={itemPhase} onValueChange={(value: PhaseValue) => setItemPhase(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={itemProductId} onValueChange={setItemProductId} disabled={!!editingItemId}>
                <SelectTrigger className={cn(!itemProductId && 'text-muted-foreground')}>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems?.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex flex-col">
                        <span>{item.product_name}</span>
                        <span className="text-xs text-muted-foreground">SKU: {item.sku}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-quantity">Required Quantity</Label>
              <Input
                id="item-quantity"
                type="number"
                min={1}
                value={itemQuantity}
                onChange={(event) => setItemQuantity(Number(event.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveItem}
              disabled={createTemplateItem.isPending || updateTemplateItem.isPending}
            >
              {(createTemplateItem.isPending || updateTemplateItem.isPending) ? 'Saving...' : 'Save Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectTemplates;
