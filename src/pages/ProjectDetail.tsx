import { useParams, useNavigate } from 'react-router-dom';
import { TopHeader } from '@/components/TopHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, AlertCircle, MapPin, FileText, Calendar, Image } from 'lucide-react';
import { useProject } from '@/hooks/useProjects';
import { useProjectStats } from '@/hooks/useProjectStats';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: projectStats } = useProjectStats(id);
  
  // Get claim items for this project
  const { data: claimItems, isLoading: claimItemsLoading } = useQuery({
    queryKey: ['project-claim-items', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('claim_items')
        .select(`
          id,
          quantity_requested,
          quantity_approved,
          created_at,
          product:inventory_items(
            product_name,
            sku
          ),
          claim:claims!inner(
            id,
            claim_number,
            onsite_user_name,
            status,
            created_at,
            photo_url
          )
        `)
        .eq('claim.project_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const stats = projectStats?.[0];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-500 text-white hover:bg-green-600' },
      completed: { label: 'Completed', className: 'bg-blue-500 text-white hover:bg-blue-600' },
      on_hold: { label: 'On Hold', className: 'bg-yellow-500 text-white hover:bg-yellow-600' },
      pending: { label: 'Pending', className: 'bg-yellow-500 text-white hover:bg-yellow-600' },
      fulfilled: { label: 'Fulfilled', className: 'bg-green-500 text-white hover:bg-green-600' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-500 text-white hover:bg-gray-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (projectLoading) {
    return (
      <div className="h-full flex flex-col">
        <TopHeader />
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full flex flex-col">
        <TopHeader title="Project Not Found" />
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/projects')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title={project.name}
        actions={
          <Button variant="outline" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="product-log">Product Log</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Total Products Allocated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.total_products_allocated || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Pending Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.pending_requests || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getStatusBadge(project.status)}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">{project.location}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(project.created_at), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                {project.description && (
                  <div className="flex items-start gap-3 pt-4 border-t">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">Description</p>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="product-log">
            <Card>
              <CardHeader>
                <CardTitle>Product Allocation Log</CardTitle>
                <p className="text-sm text-muted-foreground">
                  All products requested for this project
                </p>
              </CardHeader>
              <CardContent>
                {requestItemsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : requestItems && requestItems.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Product Name</TableHead>
                          <TableHead className="font-semibold">SKU</TableHead>
                          <TableHead className="font-semibold">Request ID</TableHead>
                          <TableHead className="font-semibold">Requested By</TableHead>
                          <TableHead className="font-semibold">Quantity</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Photo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requestItems.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.product?.product_name || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.product?.sku || '-'}
                            </TableCell>
                            <TableCell className="text-sm font-mono">
                              {item.request?.request_number || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.request?.requester_name || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.quantity_requested}
                            </TableCell>
                            <TableCell>
                              {item.request?.status ? getStatusBadge(item.request.status) : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.request?.created_at
                                ? format(new Date(item.request.created_at), 'MMM d, yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {item.request?.photo_url ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(item.request.photo_url, '_blank')}
                                >
                                  <Image className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No products allocated</h3>
                    <p className="text-sm text-muted-foreground">
                      No products have been requested for this project yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetail;
