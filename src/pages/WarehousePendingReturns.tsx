import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { PackageX, RefreshCcw, User } from 'lucide-react';
import { TopHeader } from '@/components/navigation/TopHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { usePendingReturns, useApproveReturn } from '@/hooks/useReturns';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

const WarehousePendingReturns = () => {
  const { data: returns, isLoading } = usePendingReturns();
  const approveReturn = useApproveReturn();
  const { userName } = useRole();

  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedReturn = useMemo(
    () => returns?.find(ret => ret.id === selectedReturnId) ?? null,
    [returns, selectedReturnId],
  );

  const handleOpenModal = (returnId: string) => {
    setSelectedReturnId(returnId);
    setIsModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedReturn) return;
    setIsProcessing(true);
    try {
      await approveReturn.mutateAsync({
        returnId: selectedReturn.id,
        warehouseAdminId: userName.toLowerCase().replace(/\s+/g, '-'),
        warehouseAdminName: userName,
      });
      toast.success(`Return ${selectedReturn.return_number} approved.`);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to approve return. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Pending Returns"
        description="Process damaged goods returns from onsite projects."
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <Skeleton key={idx} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : returns && returns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {returns.map(ret => (
              <Card key={ret.id} className="border-2 hover:border-primary/60 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-mono">{ret.return_number}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(ret.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <Badge className="bg-amber-500 text-white">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-muted p-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground tracking-wide">Onsite Team</p>
                      <p className="text-sm font-semibold">{ret.onsite_user_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-muted p-2">
                      <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground tracking-wide">Project</p>
                      <p className="text-sm font-semibold">{ret.project?.name || 'Unknown Project'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Reason</p>
                    <p className="text-sm border rounded-md bg-muted/40 px-3 py-2">{ret.reason}</p>
                  </div>
                  <Button onClick={() => handleOpenModal(ret.id)}>Review Return</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
            <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pending returns</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              All returns have been processed. New return requests will appear here automatically.
            </p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Return Review</DialogTitle>
            <DialogDescription>
              Confirm return quantities and approve the damaged goods return.
            </DialogDescription>
          </DialogHeader>

          {selectedReturn ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Return</p>
                  <h3 className="text-lg font-semibold font-mono">{selectedReturn.return_number}</h3>
                  <p className="text-sm text-muted-foreground">
                    Submitted {format(new Date(selectedReturn.created_at), 'MMM d, yyyy h:mm a')} • {selectedReturn.onsite_user_name}
                  </p>
                </div>
                <ScrollArea className="h-64 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReturn.return_items?.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{item.product?.product_name || 'Unknown product'}</span>
                              <span className="text-xs text-muted-foreground">SKU {item.product?.sku || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Project</p>
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    <p className="font-semibold">{selectedReturn.project?.name || 'Unknown Project'}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedReturn.project?.location || 'Location not specified'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Damage Photo</p>
                  {selectedReturn.photo_url ? (
                    <a
                      href={selectedReturn.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border overflow-hidden"
                    >
                      <img
                        src={selectedReturn.photo_url}
                        alt="Damaged goods evidence"
                        className="w-full h-44 object-cover transition-transform hover:scale-[1.01]"
                      />
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground border rounded-lg px-3 py-6 text-center">
                      No photo provided.
                    </p>
                  )}
                </div>

                {selectedReturn.notes && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">Notes</p>
                    <p className="text-sm rounded-md border bg-muted/40 px-3 py-2">
                      {selectedReturn.notes}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleApprove}
                  disabled={isProcessing || approveReturn.isPending}
                >
                  {isProcessing && approveReturn.isPending ? 'Approving...' : 'Approve Return'}
                </Button>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehousePendingReturns;
