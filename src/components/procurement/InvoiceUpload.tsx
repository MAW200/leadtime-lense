import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
    Upload,
    FileText,
    Calendar,
    DollarSign,
    Hash,
    Loader2,
    Download,
    ExternalLink,
    Trash2,
    AlertCircle,
    CheckCircle,
    File,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

// Form validation schema
const invoiceSchema = z.object({
    invoice_number: z.string().min(1, 'Invoice number is required'),
    invoice_total: z.coerce.number().positive('Invoice total must be positive'),
    invoice_date: z.date({ required_error: 'Invoice date is required' }),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface VendorInvoice {
    id: string;
    po_id: string;
    invoice_number: string;
    invoice_total: number;
    invoice_date: string;
    file_path: string | null;
    status: string;
    created_at: string;
}

interface InvoiceUploadProps {
    poId: string;
    poNumber: number;
}

export const InvoiceUpload = ({ poId, poNumber }: InvoiceUploadProps) => {
    const queryClient = useQueryClient();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Form setup
    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            invoice_number: '',
            invoice_total: 0,
            invoice_date: new Date(),
        },
    });

    // Fetch existing invoices for this PO
    const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
        queryKey: ['vendor-invoices', poId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vendor_invoices')
                .select('*')
                .eq('po_id', poId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as VendorInvoice[];
        },
    });

    // Dropzone setup - PDF only
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024, // 10MB
    });

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async (values: InvoiceFormValues) => {
            if (!selectedFile) {
                throw new Error('Please select a PDF file');
            }

            setIsUploading(true);

            // 1. Upload file to Supabase Storage
            const timestamp = Date.now();
            const sanitizedFilename = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `invoices/${poId}/${timestamp}_${sanitizedFilename}`;

            const { error: uploadError } = await supabase.storage
                .from('finance-docs')
                .upload(filePath, selectedFile, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(`File upload failed: ${uploadError.message}`);
            }

            // 2. Insert record into vendor_invoices table
            const { data, error: insertError } = await supabase
                .from('vendor_invoices')
                .insert({
                    po_id: poId,
                    invoice_number: values.invoice_number,
                    invoice_total: values.invoice_total,
                    invoice_date: format(values.invoice_date, 'yyyy-MM-dd'),
                    file_path: filePath,
                    status: 'pending',
                })
                .select()
                .single();

            if (insertError) {
                // Try to clean up uploaded file if DB insert fails
                await supabase.storage.from('finance-docs').remove([filePath]);
                throw new Error(`Failed to save invoice: ${insertError.message}`);
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-invoices', poId] });
            toast.success('Invoice Uploaded', {
                description: 'The invoice has been uploaded and recorded successfully.',
            });
            form.reset();
            setSelectedFile(null);
        },
        onError: (error: Error) => {
            console.error('Upload failed:', error);
            toast.error('Upload Failed', {
                description: error.message,
            });
        },
        onSettled: () => {
            setIsUploading(false);
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (invoice: VendorInvoice) => {
            // 1. Delete file from storage if exists
            if (invoice.file_path) {
                await supabase.storage.from('finance-docs').remove([invoice.file_path]);
            }

            // 2. Delete record from database
            const { error } = await supabase
                .from('vendor_invoices')
                .delete()
                .eq('id', invoice.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-invoices', poId] });
            toast.success('Invoice Deleted');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete invoice', {
                description: error.message,
            });
        },
    });

    // Get download URL for a file
    const getDownloadUrl = async (filePath: string) => {
        const { data } = await supabase.storage
            .from('finance-docs')
            .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank');
        } else {
            toast.error('Failed to generate download link');
        }
    };

    const onSubmit = (values: InvoiceFormValues) => {
        uploadMutation.mutate(values);
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
    };

    return (
        <div className="space-y-6">
            {/* Upload Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload Invoice
                    </CardTitle>
                    <CardDescription>
                        Upload vendor invoices for PO-{poNumber}. Only PDF files are accepted.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Dropzone */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Invoice PDF</label>
                                {selectedFile ? (
                                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                                        <File className="h-8 w-8 text-red-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{selectedFile.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(selectedFile.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={removeSelectedFile}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div
                                        {...getRootProps()}
                                        className={cn(
                                            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                                            isDragActive && 'border-primary bg-primary/5',
                                            isDragReject && 'border-destructive bg-destructive/5',
                                            !isDragActive && !isDragReject && 'border-muted-foreground/25 hover:border-primary/50'
                                        )}
                                    >
                                        <input {...getInputProps()} />
                                        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                        {isDragActive ? (
                                            <p className="text-primary font-medium">Drop the PDF here...</p>
                                        ) : isDragReject ? (
                                            <p className="text-destructive font-medium">Only PDF files are accepted</p>
                                        ) : (
                                            <>
                                                <p className="font-medium">
                                                    Drag & drop a PDF file here, or click to browse
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Max file size: 10MB
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                {/* Invoice Number */}
                                <FormField
                                    control={form.control}
                                    name="invoice_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Invoice Number</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        {...field}
                                                        placeholder="INV-001"
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Invoice Total */}
                                <FormField
                                    control={form.control}
                                    name="invoice_total"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Invoice Total</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="0.00"
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Invoice Date */}
                                <FormField
                                    control={form.control}
                                    name="invoice_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Invoice Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                'w-full pl-3 text-left font-normal',
                                                                !field.value && 'text-muted-foreground'
                                                            )}
                                                        >
                                                            <Calendar className="mr-2 h-4 w-4" />
                                                            {field.value ? (
                                                                format(field.value, 'PPP')
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <CalendarComponent
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={!selectedFile || isUploading || uploadMutation.isPending}
                                >
                                    {isUploading || uploadMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload Invoice
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Invoices List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Uploaded Invoices ({invoices.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingInvoices ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No invoices uploaded yet</p>
                            <p className="text-sm">Upload your first invoice using the form above.</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium font-mono">
                                                {invoice.invoice_number}
                                            </TableCell>
                                            <TableCell>
                                                {invoice.invoice_date
                                                    ? format(new Date(invoice.invoice_date), 'MMM dd, yyyy')
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                ${Number(invoice.invoice_total).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        invoice.status === 'paid'
                                                            ? 'default'
                                                            : invoice.status === 'approved'
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                    className={cn(
                                                        invoice.status === 'paid' && 'bg-green-600',
                                                        invoice.status === 'approved' && 'bg-blue-600'
                                                    )}
                                                >
                                                    {invoice.status === 'paid' && (
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                    )}
                                                    {invoice.status || 'pending'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {invoice.file_path && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => getDownloadUrl(invoice.file_path!)}
                                                        >
                                                            <ExternalLink className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                    )}
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete invoice{' '}
                                                                    <strong>{invoice.invoice_number}</strong>? This will
                                                                    also remove the uploaded PDF file. This action cannot
                                                                    be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => deleteMutation.mutate(invoice)}
                                                                    className="bg-destructive hover:bg-destructive/90"
                                                                >
                                                                    {deleteMutation.isPending ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        'Delete'
                                                                    )}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};


