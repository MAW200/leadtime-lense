import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle2,
    AlertTriangle,
    FileText,
    Package,
    Truck,
    Receipt,
    Loader2,
    ThumbsUp,
    FileWarning,
    ArrowRight,
    Scale,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PurchaseOrderItem {
    id: string;
    quantity_ordered: number;
    quantity_received: number;
    unit_cost: number;
}

interface VendorInvoice {
    id: string;
    invoice_number: string;
    invoice_total: number;
    invoice_date: string;
    status: string;
}

interface ThreeWayMatchProps {
    poId: string;
    poNumber: number;
}

// Tolerance for matching (in USD)
const MATCH_TOLERANCE = 0.05;

// Currency formatter
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const ThreeWayMatch = ({ poId, poNumber }: ThreeWayMatchProps) => {
    const queryClient = useQueryClient();

    // Fetch PO items for calculations
    const { data: poItems = [], isLoading: isLoadingItems } = useQuery({
        queryKey: ['po-items-match', poId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('purchase_order_items')
                .select('id, quantity_ordered, quantity_received, unit_cost')
                .eq('po_id', poId);

            if (error) throw error;
            return data as PurchaseOrderItem[];
        },
    });

    // Fetch latest invoice for this PO
    const { data: latestInvoice, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['latest-invoice', poId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vendor_invoices')
                .select('id, invoice_number, invoice_total, invoice_date, status')
                .eq('po_id', poId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return data as VendorInvoice | null;
        },
    });

    // Calculate totals
    const orderedTotal = poItems.reduce(
        (sum, item) => sum + (item.quantity_ordered || 0) * (item.unit_cost || 0),
        0
    );

    const receivedValue = poItems.reduce(
        (sum, item) => sum + (item.quantity_received || 0) * (item.unit_cost || 0),
        0
    );

    const invoiceTotal = latestInvoice?.invoice_total || 0;

    // Calculate variance between Received Value and Billed
    const variance = receivedValue - invoiceTotal;
    const absoluteVariance = Math.abs(variance);
    const isMatched = latestInvoice && absoluteVariance <= MATCH_TOLERANCE;
    const hasInvoice = !!latestInvoice;

    // Approval mutation
    const approvalMutation = useMutation({
        mutationFn: async (newStatus: string) => {
            if (!latestInvoice) throw new Error('No invoice to update');

            const { error } = await supabase
                .from('vendor_invoices')
                .update({ status: newStatus })
                .eq('id', latestInvoice.id);

            if (error) throw error;
        },
        onSuccess: (_, newStatus) => {
            queryClient.invalidateQueries({ queryKey: ['latest-invoice', poId] });
            queryClient.invalidateQueries({ queryKey: ['vendor-invoices', poId] });

            if (newStatus === 'approved') {
                toast.success('Invoice Approved', {
                    description: 'The invoice has been approved for payment.',
                });
            } else if (newStatus === 'variance') {
                toast.success('Credit Note Requested', {
                    description: 'A credit note request has been submitted.',
                });
            }
        },
        onError: (error: Error) => {
            toast.error('Action Failed', {
                description: error.message,
            });
        },
    });

    const isLoading = isLoadingItems || isLoadingInvoice;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-32 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Scale className="h-5 w-5" />
                            Three-Way Match
                        </CardTitle>
                        <CardDescription>
                            Compare PO authorized amount, received value, and billed amount for PO-{poNumber}
                        </CardDescription>
                    </div>
                    {hasInvoice && (
                        <Badge
                            variant={isMatched ? 'default' : 'destructive'}
                            className={cn(
                                'text-sm px-3 py-1',
                                isMatched ? 'bg-green-600' : 'bg-red-600'
                            )}
                        >
                            {isMatched ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    MATCHED
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    VARIANCE
                                </>
                            )}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Three Columns */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Authorized (Ordered Total) */}
                    <div className="relative p-6 rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
                            <FileText className="h-5 w-5" />
                            <span className="font-semibold text-sm uppercase tracking-wide">Authorized</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                            {formatCurrency(orderedTotal)}
                        </p>
                        <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-2">
                            PO ordered value
                        </p>
                        <Package className="absolute top-4 right-4 h-8 w-8 text-blue-200 dark:text-blue-800" />
                    </div>

                    {/* Receipt Value */}
                    <div className="relative p-6 rounded-lg border-2 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                            <Truck className="h-5 w-5" />
                            <span className="font-semibold text-sm uppercase tracking-wide">Receipt Value</span>
                        </div>
                        <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                            {formatCurrency(receivedValue)}
                        </p>
                        <p className="text-sm text-amber-600/70 dark:text-amber-400/70 mt-2">
                            Goods received value
                        </p>
                        <Truck className="absolute top-4 right-4 h-8 w-8 text-amber-200 dark:text-amber-800" />
                    </div>

                    {/* Billed (Invoice Total) */}
                    <div
                        className={cn(
                            'relative p-6 rounded-lg border-2',
                            hasInvoice
                                ? 'border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800'
                                : 'border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700'
                        )}
                    >
                        <div
                            className={cn(
                                'flex items-center gap-2 mb-3',
                                hasInvoice
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-gray-500 dark:text-gray-400'
                            )}
                        >
                            <Receipt className="h-5 w-5" />
                            <span className="font-semibold text-sm uppercase tracking-wide">Billed</span>
                        </div>
                        {hasInvoice ? (
                            <>
                                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                                    {formatCurrency(invoiceTotal)}
                                </p>
                                <p className="text-sm text-purple-600/70 dark:text-purple-400/70 mt-2">
                                    Invoice #{latestInvoice.invoice_number}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-2xl font-medium text-gray-400 dark:text-gray-500">
                                    Pending Invoice
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                    No invoice uploaded yet
                                </p>
                            </>
                        )}
                        <Receipt
                            className={cn(
                                'absolute top-4 right-4 h-8 w-8',
                                hasInvoice
                                    ? 'text-purple-200 dark:text-purple-800'
                                    : 'text-gray-200 dark:text-gray-700'
                            )}
                        />
                    </div>
                </div>

                {/* Variance Details */}
                {hasInvoice && !isMatched && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-red-700 dark:text-red-400">
                                    Variance Detected
                                </h4>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                    {variance > 0 ? (
                                        <>
                                            Received value exceeds invoice by{' '}
                                            <strong>{formatCurrency(absoluteVariance)}</strong>
                                        </>
                                    ) : (
                                        <>
                                            Invoice exceeds received value by{' '}
                                            <strong>{formatCurrency(absoluteVariance)}</strong>
                                        </>
                                    )}
                                </p>
                                <div className="flex items-center gap-2 mt-3 text-sm">
                                    <span className="text-amber-600 font-medium">
                                        {formatCurrency(receivedValue)}
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-gray-400" />
                                    <span className="text-purple-600 font-medium">
                                        {formatCurrency(invoiceTotal)}
                                    </span>
                                    <span className="text-red-600 font-bold ml-2">
                                        ({variance > 0 ? '+' : ''}{formatCurrency(variance)})
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Match Success */}
                {hasInvoice && isMatched && (
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div>
                                <h4 className="font-semibold text-green-700 dark:text-green-400">
                                    Three-Way Match Successful
                                </h4>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Receipt value and invoice total are within tolerance ({formatCurrency(MATCH_TOLERANCE)})
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Approval Workflow Buttons */}
                {hasInvoice && latestInvoice.status !== 'approved' && latestInvoice.status !== 'paid' && (
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        {isMatched ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="bg-green-600 hover:bg-green-700">
                                        <ThumbsUp className="h-4 w-4 mr-2" />
                                        Approve for Payment
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <ThumbsUp className="h-5 w-5 text-green-600" />
                                            Approve Invoice for Payment?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="space-y-3">
                                            <p>
                                                You are about to approve invoice <strong>#{latestInvoice.invoice_number}</strong> for payment.
                                            </p>
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-sm">
                                                    <strong>Invoice Total:</strong> {formatCurrency(invoiceTotal)}
                                                </p>
                                                <p className="text-sm">
                                                    <strong>PO:</strong> PO-{poNumber}
                                                </p>
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => approvalMutation.mutate('approved')}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {approvalMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Approve'
                                            )}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <FileWarning className="h-4 w-4 mr-2" />
                                        Request Credit Note
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <FileWarning className="h-5 w-5 text-red-600" />
                                            Request Credit Note?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="space-y-3">
                                            <p>
                                                A variance of <strong>{formatCurrency(absoluteVariance)}</strong> has been detected.
                                            </p>
                                            <p>
                                                This will flag invoice <strong>#{latestInvoice.invoice_number}</strong> for review
                                                and request a credit note from the vendor.
                                            </p>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => approvalMutation.mutate('variance')}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            {approvalMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Request Credit Note'
                                            )}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                )}

                {/* Already Approved Status */}
                {hasInvoice && (latestInvoice.status === 'approved' || latestInvoice.status === 'paid') && (
                    <div className="flex items-center justify-end gap-2 pt-4 border-t">
                        <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {latestInvoice.status === 'paid' ? 'Paid' : 'Approved for Payment'}
                        </Badge>
                    </div>
                )}

                {/* Variance Status */}
                {hasInvoice && latestInvoice.status === 'variance' && (
                    <div className="flex items-center justify-end gap-2 pt-4 border-t">
                        <Badge variant="destructive">
                            <FileWarning className="h-3 w-3 mr-1" />
                            Credit Note Requested
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


