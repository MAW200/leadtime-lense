import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ClipboardList, PackageSearch, ShieldAlert, User } from 'lucide-react';
import { TopHeader } from '@/components/navigation/TopHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePendingClaims, useApproveClaim, useDenyClaim } from '@/hooks/useClaims';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

const DENIAL_REASONS = [
  'Out of Stock',
  'Photo Unclear',
  'Invalid Request',
  'Incorrect Quantity',
  'Other',
];

const WarehousePendingClaims = () => {
  const { data: claims, isLoading } = usePendingClaims();
  const approveClaim = useApproveClaim();
  const denyClaim = useDenyClaim();
  const { userName } = useRole();

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [approvalQuantities, setApprovalQuantities] = useState<Record<string, number>>({});
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isDenialModalOpen, setIsDenialModalOpen] = useState(false);
  const [denialReason, setDenialReason] = useState<string>('Out of Stock');
  const [denialNotes, setDenialNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedClaim = useMemo(
    () => claims?.find(claim => claim.id === selectedClaimId) ?? null,
    [claims, selectedClaimId],
  );

  const handleOpenReview = (claimId: string) => {
    setSelectedClaimId(claimId);
    const claim = claims?.find(item => item.id === claimId);

    if (claim) {
      const defaults: Record<string, number> = {};
      claim.claim_items?.forEach(item => {
        const available = item.product?.in_stock ?? 0;
        defaults[item.id] = Math.min(item.quantity_requested, available);
      });
      setApprovalQuantities(defaults);
    } else {
      setApprovalQuantities({});
    }
    setIsReviewOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedClaim) return;
    setIsProcessing(true);
    try {
      await approveClaim.mutateAsync({
        claimId: selectedClaim.id,
        warehouseAdminId: userName.toLowerCase().replace(/\s+/g, '-'),
        warehouseAdminName: userName,
        approvedQuantities: approvalQuantities,
      });
      toast.success(`Claim ${selectedClaim.claim_number} processed successfully.`);
      setIsReviewOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to approve the claim. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!selectedClaim) return;
    if (!denialReason) {
      toast.error('Select a reason for denial.');
      return;
    }

    setIsProcessing(true);
    try {
      await denyClaim.mutateAsync({
        claimId: selectedClaim.id,
        warehouseAdminId: userName.toLowerCase().replace(/\s+/g, '-'),
        warehouseAdminName: userName,
        reason: `${denialReason}${denialNotes ? ` - ${denialNotes}` : ''}`,
      });
      toast.success(`Claim ${selectedClaim.claim_number} denied.`);
      setIsDenialModalOpen(false);
      setIsReviewOpen(false);
      setDenialNotes('');
      setDenialReason('Out of Stock');
    } catch (error) {
      console.error(error);
      toast.error('Failed to deny the claim. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Pending Claims"
        description="Review and process material claims submitted by onsite teams."
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <Skeleton key={idx} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : claims && claims.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {claims.map(claim => {
              const isEmergency = claim.claim_type === 'emergency';
              return (
                <Card
                  key={claim.id}
                  className={`transition-all border-2 ${isEmergency ? 'border-red-500 shadow-lg shadow-red-200/60' : 'hover:border-primary/60'}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-mono">{claim.claim_number}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(claim.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className="bg-yellow-500 text-white">Pending</Badge>
                        {isEmergency && (
                          <Badge variant="destructive" className="flex items-center gap-1 text-xs uppercase">
                            <ShieldAlert className="h-3 w-3" />
                            Emergency
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-muted p-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Onsite Team</p>
                        <p className="text-sm font-semibold">{claim.onsite_user_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-muted p-2">
                        <PackageSearch className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Project</p>
                        <p className="text-sm font-semibold">{claim.project?.name || 'Unknown Project'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Requested Items</p>
                      <div className="space-y-1.5">
                        {claim.claim_items?.slice(0, 3).map(item => (
                          <div key={item.id} className="flex justify-between text-sm rounded-md bg-muted/40 px-3 py-1.5">
                            <span className="truncate">{item.product?.product_name || 'Unknown product'}</span>
                            <span className="font-semibold">{item.quantity_requested}x</span>
                          </div>
                        ))}
                        {(claim.claim_items?.length ?? 0) > 3 && (
                          <p className="text-xs text-muted-foreground pl-1">
                            +{(claim.claim_items?.length ?? 0) - 3} more items
                          </p>
                        )}
                      </div>
                    </div>
                    {claim.claim_type === 'emergency' && claim.emergency_reason && (
                      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        <strong>Emergency Reason:</strong> {claim.emergency_reason}
                      </div>
                    )}
                    <Button className="w-full" onClick={() => handleOpenReview(claim.id)}>
                      Review Claim
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pending claims</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              All claims have been processed. New submissions will appear here automatically.
            </p>
          </div>
        )}
      </div>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Claim Review</DialogTitle>
            <DialogDescription>
              Validate requested items against available stock and approve with the appropriate quantities.
            </DialogDescription>
          </DialogHeader>

          {selectedClaim ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Claim</p>
                  <h3 className="text-lg font-semibold font-mono">{selectedClaim.claim_number}</h3>
                  <p className="text-sm text-muted-foreground">
                    Submitted {format(new Date(selectedClaim.created_at), 'MMM d, yyyy h:mm a')} • {selectedClaim.onsite_user_name}
                  </p>
                </div>

                <ScrollArea className="h-64 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Requested</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead className="text-right">Approve Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedClaim.claim_items?.map(item => {
                        const available = item.product?.in_stock ?? 0;
                        const requested = item.quantity_requested;
                        const approved = approvalQuantities[item.id] ?? requested;
                        const shortage = requested - approved;
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{item.product?.product_name || 'Unknown product'}</span>
                                <span className="text-xs text-muted-foreground">SKU: {item.product?.sku || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{requested}</TableCell>
                            <TableCell className="text-right">{available}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min={0}
                                max={available}
                                value={approved}
                                onChange={(event) => {
                                  const value = Number(event.target.value);
                                  const safeValue = Math.min(Math.max(0, Math.round(value)), available);
                                  setApprovalQuantities(prev => ({ ...prev, [item.id]: safeValue }));
                                }}
                                className="w-24 text-right"
                              />
                              {shortage > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Short by {shortage} units from requested.
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Project</p>
                  <p className="text-sm font-semibold">{selectedClaim.project?.name || 'Unknown project'}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedClaim.project?.location || 'Location not specified'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Audit Photo</Label>
                  {selectedClaim.photo_url ? (
                    <a
                      href={selectedClaim.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border overflow-hidden"
                    >
                      <img src={selectedClaim.photo_url} alt="Claim evidence" className="w-full h-44 object-cover transition-transform hover:scale-[1.01]" />
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground border rounded-lg px-3 py-6 text-center">
                      No photo provided.
                    </p>
                  )}
                </div>

                {selectedClaim.notes && (
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <p className="text-sm rounded-md border bg-muted/40 px-3 py-2">{selectedClaim.notes}</p>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing || approveClaim.isPending}
                    className="w-full"
                  >
                    {isProcessing && approveClaim.isPending ? 'Approving...' : 'Approve Claim'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsDenialModalOpen(true)}
                    disabled={isProcessing || denyClaim.isPending}
                  >
                    Deny Claim
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isDenialModalOpen} onOpenChange={setIsDenialModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deny Claim</DialogTitle>
            <DialogDescription>
              Provide a reason for denying this claim so the onsite team can be notified.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="denial-reason">Reason</Label>
              <Select value={denialReason} onValueChange={setDenialReason}>
                <SelectTrigger id="denial-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DENIAL_REASONS.map(reason => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="denial-notes">Additional Comments</Label>
              <Textarea
                id="denial-notes"
                placeholder="Add extra context for the onsite team (optional)"
                rows={4}
                value={denialNotes}
                onChange={(event) => setDenialNotes(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDenialModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeny}
              disabled={isProcessing || denyClaim.isPending}
            >
              {isProcessing && denyClaim.isPending ? 'Submitting...' : 'Confirm Denial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehousePendingClaims;
