import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Package, PackagePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PhotoUpload } from '@/components/PhotoUpload';
import { useProject } from '@/hooks/useProjects';
import { useProjectMaterials } from '@/hooks/useProjectMaterials';
import { useClaims, useCreateClaim } from '@/hooks/useClaims';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { ProjectMaterial } from '@/lib/supabase';
import { useInventoryItems } from '@/hooks/useInventory';
import { useCreateReturn } from '@/hooks/useReturns';

type PhaseFilter = 'all' | 'P1' | 'P2a' | 'P2b';

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; className?: string }> = {
  pending: { label: 'Pending', variant: 'secondary', className: 'bg-yellow-500 text-white hover:bg-yellow-600' },
  approved: { label: 'Approved', variant: 'default', className: 'bg-green-600 hover:bg-green-700' },
  partial_approved: { label: 'Partially Approved', variant: 'default', className: 'bg-blue-600 hover:bg-blue-700' },
  denied: { label: 'Denied', variant: 'default', className: 'bg-red-600 hover:bg-red-700' },
};

const OnsiteProjectBOM = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userName } = useRole();

  const [activeTab, setActiveTab] = useState<'bom' | 'history'>('bom');
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewClaimId, setViewClaimId] = useState<string | null>(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'approved' | 'partial_approved' | 'pending' | 'denied'>('all');
  const [emergencyReason, setEmergencyReason] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [emergencyPhotoUrl, setEmergencyPhotoUrl] = useState('');
  const [emergencyItems, setEmergencyItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [emergencyProductId, setEmergencyProductId] = useState('');
  const [emergencyQuantity, setEmergencyQuantity] = useState<number>(1);
  const [isEmergencySubmitting, setIsEmergencySubmitting] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnClaimId, setReturnClaimId] = useState<string | null>(null);
  const [returnPhotoUrl, setReturnPhotoUrl] = useState('');
  const [returnReason, setReturnReason] = useState('Damaged in Transit');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [isReturnSubmitting, setIsReturnSubmitting] = useState(false);

  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: materials, isLoading: materialsLoading } = useProjectMaterials(id);
  const { data: claims, isLoading: claimsLoading } = useClaims({ projectId: id });
  const createClaim = useCreateClaim();
  const { data: inventoryItems } = useInventoryItems();
  const createReturn = useCreateReturn();

  const onsiteUserId = useMemo(() => userName?.toLowerCase().replace(/\s+/g, '-') || 'onsite-user', [userName]);

  const resetClaimForm = () => {
    setSelectedItems({});
    setPhaseFilter('all');
    setPhotoUrl('');
    setNotes('');
    setIsClaimModalOpen(false);
  };

  const resetEmergencyForm = () => {
    setEmergencyItems([]);
    setEmergencyPhotoUrl('');
    setEmergencyNotes('');
    setEmergencyReason('');
    setEmergencyProductId('');
    setEmergencyQuantity(1);
    setIsEmergencyModalOpen(false);
  };

  const filteredMaterials = useMemo(() => {
    if (!materials) return [];
    if (phaseFilter === 'all') return materials;
    return materials.filter(material => material.phase === phaseFilter);
  }, [materials, phaseFilter]);

  const remainingQuantity = (material: ProjectMaterial) => material.required_quantity - material.claimed_quantity;

  const handleQuantityChange = (materialId: string, max: number, value: number) => {
    if (value <= 0) {
      setSelectedItems(prev => {
        const updated = { ...prev };
        delete updated[materialId];
        return updated;
      });
      return;
    }

    const safeValue = Math.min(Math.round(value), max);
    setSelectedItems(prev => ({ ...prev, [materialId]: safeValue }));
  };

  const handleSubmitClaim = async () => {
    if (!materials || !project || !id) return;

    const payloadItems = materials
      .filter(material => selectedItems[material.id] && selectedItems[material.id] > 0)
      .map(material => ({
        productId: material.product_id,
        quantity: selectedItems[material.id],
      }));

    if (payloadItems.length === 0) {
      toast.error('Select at least one product and quantity to claim.');
      return;
    }

    if (!photoUrl) {
      toast.error('Photo is required before submitting a claim.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createClaim.mutateAsync({
        projectId: id,
        onsiteUserId,
        onsiteUserName: userName,
        photoUrl,
        notes: notes || undefined,
        items: payloadItems,
        claimType: 'standard',
      });

      toast.success('Claim submitted successfully.');
      resetClaimForm();
      setActiveTab('history');
    } catch (error) {
      console.error(error);
      toast.error('Unable to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEmergencyItem = () => {
    if (!emergencyProductId) {
      toast.error('Select a product to add.');
      return;
    }
    const product = inventoryItems?.find(item => item.id === emergencyProductId);
    if (!product) {
      toast.error('Selected product is unavailable.');
      return;
    }
    if (emergencyQuantity <= 0) {
      toast.error('Quantity must be greater than zero.');
      return;
    }
    const safeQuantity = Math.min(Math.round(emergencyQuantity), product.in_stock || 0);
    if (safeQuantity <= 0) {
      toast.error('Insufficient stock for this product.');
      return;
    }

    setEmergencyItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === emergencyProductId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { productId: emergencyProductId, quantity: safeQuantity };
        return updated;
      }
      return [...prev, { productId: emergencyProductId, quantity: safeQuantity }];
    });
    setEmergencyQuantity(1);
    setEmergencyProductId('');
  };

  const handleRemoveEmergencyItem = (productId: string) => {
    setEmergencyItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleSubmitEmergencyClaim = async () => {
    if (!id) return;
    if (emergencyItems.length === 0) {
      toast.error('Add at least one product to the emergency claim.');
      return;
    }
    if (!emergencyReason.trim()) {
      toast.error('Emergency reason is required.');
      return;
    }
    if (!emergencyPhotoUrl) {
      toast.error('Photo is required for emergency claims.');
      return;
    }

    try {
      setIsEmergencySubmitting(true);
      await createClaim.mutateAsync({
        projectId: id,
        onsiteUserId,
        onsiteUserName: userName,
        photoUrl: emergencyPhotoUrl,
        notes: emergencyNotes || undefined,
        items: emergencyItems,
        claimType: 'emergency',
        emergencyReason,
      });
      toast.success('Emergency claim submitted and flagged to administrators.');
      resetEmergencyForm();
      setActiveTab('history');
    } catch (error) {
      console.error(error);
      toast.error('Unable to submit emergency claim. Please try again.');
    } finally {
      setIsEmergencySubmitting(false);
    }
  };

  const openReturnModal = (claimId: string) => {
    const claim = claims?.find(item => item.id === claimId);
    if (!claim) return;
    const defaults: Record<string, number> = {};
    claim.claim_items?.forEach(item => {
      defaults[item.id] = Math.min(item.quantity_approved || 0, item.quantity_requested);
    });
    setReturnClaimId(claimId);
    setReturnQuantities(defaults);
    setReturnPhotoUrl('');
    setReturnReason('Damaged in Transit');
    setReturnNotes('');
    setIsReturnModalOpen(true);
  };

  const handleSubmitReturn = async () => {
    if (!returnClaimId || !id) return;
    const claim = claims?.find(item => item.id === returnClaimId);
    if (!claim) return;

    const items = (claim.claim_items || [])
      .filter(item => returnQuantities[item.id] && returnQuantities[item.id]! > 0)
      .map(item => ({
        productId: item.product_id,
        quantity: Math.min(returnQuantities[item.id]!, item.quantity_approved),
      }));

    if (items.length === 0) {
      toast.error('Select at least one item to return.');
      return;
    }

    if (!returnPhotoUrl) {
      toast.error('Photo evidence is required.');
      return;
    }

    setIsReturnSubmitting(true);
    try {
      await createReturn.mutateAsync({
        projectId: id,
        onsiteUserId,
        onsiteUserName: userName,
        photoUrl: returnPhotoUrl,
        reason: returnReason,
        notes: returnNotes || undefined,
        claimId: claim.id,
        items,
      });
      toast.success('Return submitted for review.');
      setIsReturnModalOpen(false);
      setReturnClaimId(null);
      setActiveTab('history');
    } catch (error) {
      console.error(error);
      toast.error('Unable to submit return. Please try again.');
    } finally {
      setIsReturnSubmitting(false);
    }
  };

  if (projectLoading || materialsLoading) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader />
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader title="Project Not Found" />
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/onsite/projects')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyMaterials = materials && materials.length > 0;

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={project.name}
        description="Manage your Bill of Materials and submit claims."
        actions={
          <Button variant="outline" onClick={() => navigate('/onsite/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="bom">Bill of Materials</TabsTrigger>
            <TabsTrigger value="history">Claim History</TabsTrigger>
          </TabsList>

          <TabsContent value="bom">
            {hasAnyMaterials ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Material List</h2>
                    <p className="text-sm text-muted-foreground">
                      Review remaining quantities and initiate claims per phase.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => setIsClaimModalOpen(true)}>
                      <Package className="h-4 w-4 mr-2" />
                      Initiate Claim
                    </Button>
                    <Button variant="destructive" onClick={() => setIsEmergencyModalOpen(true)}>
                      <PackagePlus className="h-4 w-4 mr-2" />
                      Emergency Claim
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Phase</TableHead>
                        <TableHead className="font-semibold">Product Name</TableHead>
                        <TableHead className="font-semibold">SKU</TableHead>
                        <TableHead className="font-semibold text-right">Required Qty</TableHead>
                        <TableHead className="font-semibold text-right">Claimed Qty</TableHead>
                        <TableHead className="font-semibold text-right">Remaining Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials?.map(material => {
                        const remaining = remainingQuantity(material);
                        const statusBadge = remaining <= 0
                          ? { label: 'Fulfilled', className: 'bg-secondary text-secondary-foreground' }
                          : { label: `${remaining} remaining`, className: 'bg-green-500 text-white' };

                        return (
                          <TableRow key={material.id}>
                            <TableCell className="font-medium">{material.phase}</TableCell>
                            <TableCell>{material.product?.product_name || '-'}</TableCell>
                            <TableCell className="text-muted-foreground">{material.product?.sku || '-'}</TableCell>
                            <TableCell className="text-right">{material.required_quantity}</TableCell>
                            <TableCell className="text-right">{material.claimed_quantity}</TableCell>
                            <TableCell className="text-right">
                              <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No materials assigned</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  This project doesn't have any materials in its Bill of Materials yet.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Claim History</h2>
                <p className="text-sm text-muted-foreground">
                  Track the status of all claims submitted for this project.
                </p>
              </div>

              {claimsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : claims && claims.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <p className="text-sm font-medium">Filter</p>
                    <Select value={historyStatusFilter} onValueChange={(value: typeof historyStatusFilter) => setHistoryStatusFilter(value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="partial_approved">Partially Approved</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Claim #</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Items</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims
                        .filter(claim => historyStatusFilter === 'all' || claim.status === historyStatusFilter)
                        .map(claim => {
                        const badgeConfig = STATUS_BADGES[claim.status] || STATUS_BADGES.pending;
                        return (
                          <TableRow key={claim.id}>
                            <TableCell className="font-medium">{claim.claim_number}</TableCell>
                            <TableCell>{format(new Date(claim.created_at), 'MMM d, yyyy h:mm a')}</TableCell>
                            <TableCell>{claim.claim_items?.length || 0}</TableCell>
                            <TableCell>
                              <Badge className={badgeConfig.className}>{badgeConfig.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => setViewClaimId(claim.id)}>
                                View
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
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
                  <h3 className="text-lg font-semibold mb-2">No claims submitted yet</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Submit your first claim to see it appear here.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isClaimModalOpen} onOpenChange={setIsClaimModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Initiate Claim</DialogTitle>
            <DialogDescription>
              Select products from the Bill of Materials and specify the quantities you need. Remaining quantities are enforced automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Bill of Materials</Label>
                <Select value={phaseFilter} onValueChange={(value: PhaseFilter) => setPhaseFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    <SelectItem value="P1">Phase 1 (P1)</SelectItem>
                    <SelectItem value="P2a">Phase 2A (P2a)</SelectItem>
                    <SelectItem value="P2b">Phase 2B (P2b)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-64 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map(material => {
                      const remaining = remainingQuantity(material);
                      const disabled = remaining <= 0;

                      return (
                        <TableRow key={material.id} className={disabled ? 'opacity-50' : ''}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{material.product?.product_name || '-'}</span>
                              <span className="text-xs text-muted-foreground">
                                Phase {material.phase} • SKU {material.product?.sku || '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={disabled ? 'secondary' : 'outline'}>
                              {remaining}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={0}
                              max={remaining}
                              disabled={disabled}
                              value={selectedItems[material.id] ?? ''}
                              onChange={(event) => handleQuantityChange(material.id, remaining, Number(event.target.value))}
                              className="w-24 text-right"
                              placeholder="0"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <PhotoUpload
                  required
                  bucketName="claim-photos"
                  onPhotoUploaded={(url) => setPhotoUrl(url)}
                  photoUrl={photoUrl}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="claim-notes">Notes (Optional)</Label>
                <Textarea
                  id="claim-notes"
                  placeholder="Provide any additional context for this claim..."
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetClaimForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmitClaim} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewClaimId} onOpenChange={(open) => !open && setViewClaimId(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>
              Review the products and quantities included in this claim.
            </DialogDescription>
          </DialogHeader>

          {claims && viewClaimId ? (
            (() => {
              const claim = claims.find(item => item.id === viewClaimId);
              if (!claim) return null;
              const badgeConfig = STATUS_BADGES[claim.status] || STATUS_BADGES.pending;

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold font-mono">{claim.claim_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted {format(new Date(claim.created_at), 'MMM d, yyyy h:mm a')} by {claim.onsite_user_name}
                      </p>
                    </div>
                    <Badge className={badgeConfig.className}>{badgeConfig.label}</Badge>
                  </div>

                  {claim.notes && (
                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                      <span className="font-semibold">Notes:</span> {claim.notes}
                    </div>
                  )}

                  {claim.denial_reason && (
                    <div className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      <span className="font-semibold">Denial Reason:</span> {claim.denial_reason}
                    </div>
                  )}

                  <ScrollArea className="h-48 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Requested</TableHead>
                          <TableHead className="text-right">Approved</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {claim.claim_items?.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{item.product?.product_name || '-'}</span>
                                <span className="text-xs text-muted-foreground">SKU {item.product?.sku || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity_requested}</TableCell>
                            <TableCell className="text-right">{item.quantity_approved}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  {(claim.status === 'approved' || claim.status === 'partial_approved') && (
                    <Button variant="outline" onClick={() => openReturnModal(claim.id)}>
                      Report Damaged Goods
                    </Button>
                  )}
                </div>
              );
            })()
          ) : null}

          <DialogFooter>
            <Button onClick={() => setViewClaimId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEmergencyModalOpen} onOpenChange={setIsEmergencyModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Emergency Claim</DialogTitle>
            <DialogDescription>
              Emergency claims allow access to any inventory item. Provide a clear reason and supporting photo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergency-reason">
                  Emergency Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="emergency-reason"
                  placeholder="Explain why this emergency claim is required..."
                  value={emergencyReason}
                  onChange={(event) => setEmergencyReason(event.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="font-semibold">Inventory Items</Label>
                <div className="flex items-center gap-3">
                  <Select value={emergencyProductId} onValueChange={setEmergencyProductId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {inventoryItems?.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex flex-col">
                            <span>{item.product_name}</span>
                            <span className="text-xs text-muted-foreground">SKU {item.sku} • In stock {item.in_stock}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={emergencyQuantity}
                    onChange={(event) => setEmergencyQuantity(Number(event.target.value))}
                    className="w-24 text-right"
                  />
                  <Button type="button" onClick={handleAddEmergencyItem}>
                    Add
                  </Button>
                </div>

                <ScrollArea className="h-48 rounded-md border">
                  <div className="divide-y">
                    {emergencyItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4 text-center">
                        No items added yet. Select a product and quantity to include it in the emergency claim.
                      </p>
                    ) : (
                      emergencyItems.map(item => {
                        const product = inventoryItems?.find(p => p.id === item.productId);
                        return (
                          <div key={item.productId} className="flex items-center justify-between px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{product?.product_name || 'Unknown product'}</span>
                              <span className="text-xs text-muted-foreground">
                                SKU {product?.sku || 'N/A'} • Qty {item.quantity}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveEmergencyItem(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency-notes">Additional Notes</Label>
                <Textarea
                  id="emergency-notes"
                  placeholder="Provide extra context for warehouse and admin teams (optional)"
                  rows={4}
                  value={emergencyNotes}
                  onChange={(event) => setEmergencyNotes(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <PhotoUpload
                required
                bucketName="claim-photos"
                onPhotoUploaded={(url) => setEmergencyPhotoUrl(url)}
                photoUrl={emergencyPhotoUrl}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetEmergencyForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEmergencyClaim} disabled={isEmergencySubmitting}>
              {isEmergencySubmitting ? 'Submitting...' : 'Submit Emergency Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Report Damaged Goods</DialogTitle>
            <DialogDescription>
              Select the items and quantities you are returning, provide the reason, and upload a photo showing the damage.
            </DialogDescription>
          </DialogHeader>

          {returnClaimId && claims ? (
            (() => {
              const claim = claims.find(item => item.id === returnClaimId);
              if (!claim) return null;
              const returnItems = claim.claim_items || [];
              const reasonOptions = [
                'Damaged in Transit',
                'Defective Product',
                'Incorrect Item',
                'Quality Issue',
              ];
              return (
                <div className="space-y-4 py-4">
                  <ScrollArea className="h-48 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Approved Qty</TableHead>
                          <TableHead className="text-right">Return Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returnItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{item.product?.product_name || 'Unknown product'}</span>
                                <span className="text-xs text-muted-foreground">SKU {item.product?.sku || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity_approved}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min={0}
                                max={item.quantity_approved}
                                value={returnQuantities[item.id] ?? 0}
                                onChange={(event) => {
                                  const value = Number(event.target.value);
                                  const safeValue = Math.min(Math.max(0, Math.round(value)), item.quantity_approved);
                                  setReturnQuantities(prev => ({ ...prev, [item.id]: safeValue }));
                                }}
                                className="w-24 text-right"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  <div className="space-y-2">
                    <Label>Return Reason</Label>
                    <Select value={returnReason} onValueChange={setReturnReason}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {reasonOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Damage Photo</Label>
                    <PhotoUpload
                      required
                      bucketName="claim-photos"
                      onPhotoUploaded={(url) => setReturnPhotoUrl(url)}
                      photoUrl={returnPhotoUrl}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="return-notes">Additional Notes</Label>
                    <Textarea
                      id="return-notes"
                      placeholder="Provide extra details about the damage (optional)"
                      rows={3}
                      value={returnNotes}
                      onChange={(event) => setReturnNotes(event.target.value)}
                    />
                  </div>
                </div>
              );
            })()
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReturn} disabled={isReturnSubmitting}>
              {isReturnSubmitting ? 'Submitting...' : 'Submit Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnsiteProjectBOM;
