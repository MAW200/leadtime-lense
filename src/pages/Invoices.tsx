import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TopHeader } from '@/components/navigation/TopHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { FileText, Download, Search, ExternalLink, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VendorInvoice {
  id: string;
  po_id: string;
  invoice_number: string;
  invoice_total: number;
  invoice_date: string;
  file_path: string | null;
  status: 'pending' | 'approved' | 'variance' | 'paid';
  created_at: string;
  purchase_orders?: {
    po_number: number;
    vendors?: {
      name: string;
    };
  };
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  variance: 'bg-red-500/20 text-red-400 border-red-500/30',
  paid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_invoices')
        .select(`
          *,
          purchase_orders (
            po_number,
            vendors (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VendorInvoice[];
    },
  });

  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.purchase_orders?.vendors?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(invoice.purchase_orders?.po_number).includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDownload = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('finance-docs')
      .createSignedUrl(filePath, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate summary stats
  const totalPending = filteredInvoices?.filter((i) => i.status === 'pending').reduce((sum, i) => sum + i.invoice_total, 0) || 0;
  const totalApproved = filteredInvoices?.filter((i) => i.status === 'approved').reduce((sum, i) => sum + i.invoice_total, 0) || 0;
  const totalVariance = filteredInvoices?.filter((i) => i.status === 'variance').reduce((sum, i) => sum + i.invoice_total, 0) || 0;

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Invoices"
        description="Manage vendor invoices and payment approvals"
      />

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredInvoices?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-400">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{formatCurrency(totalPending)}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-400">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(totalApproved)}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-400">Variance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{formatCurrency(totalVariance)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice #, vendor, or PO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="variance">Variance</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredInvoices?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No invoices found</p>
                <p className="text-sm">Invoices will appear here when uploaded to purchase orders.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>PO #</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices?.map((invoice) => (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {invoice.invoice_number || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.purchase_orders?.vendors?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary"
                          onClick={() => navigate(`/purchase-orders/${invoice.po_id}`)}
                        >
                          PO-{invoice.purchase_orders?.po_number}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        {invoice.invoice_date
                          ? format(new Date(invoice.invoice_date), 'MMM d, yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.invoice_total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[invoice.status] || statusColors.pending}>
                          {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.file_path && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownload(invoice.file_path!)}
                              title="Download Invoice"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/purchase-orders/${invoice.po_id}`)}
                          >
                            View PO
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Invoices;

