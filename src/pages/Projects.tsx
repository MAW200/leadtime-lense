import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopHeader } from '@/components/TopHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FolderKanban, Package, AlertCircle } from 'lucide-react';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { useProjectStats } from '@/hooks/useProjectStats';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Projects = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'on_hold'>('active');
  const [description, setDescription] = useState('');

  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects(statusFilter);
  const { data: projectStats } = useProjectStats();
  const createProject = useCreateProject();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-500 text-white hover:bg-green-600' },
      completed: { label: 'Completed', className: 'bg-blue-500 text-white hover:bg-blue-600' },
      on_hold: { label: 'On Hold', className: 'bg-yellow-500 text-white hover:bg-yellow-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleSubmit = async () => {
    if (!name) {
      toast.error('Please enter a project name');
      return;
    }

    try {
      await createProject.mutateAsync({
        name,
        location: location || undefined,
        status,
        description: description || undefined,
      });

      toast.success('Project created successfully');
      handleClose();
    } catch (error) {
      toast.error('Failed to create project');
      console.error(error);
    }
  };

  const handleClose = () => {
    setName('');
    setLocation('');
    setStatus('active');
    setDescription('');
    setIsNewProjectOpen(false);
  };

  const getProjectStats = (projectId: string) => {
    const stats = projectStats?.find(s => s.project_id === projectId);
    return {
      totalProducts: stats?.total_products_allocated || 0,
      pendingRequests: stats?.pending_requests || 0,
    };
  };

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Projects"
        description="Manage projects and track inventory usage by location"
        actions={
          <Button onClick={() => setIsNewProjectOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="space-y-6">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="on_hold">On Hold</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const stats = getProjectStats(project.id);
                return (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold mb-1">
                            {project.name}
                          </CardTitle>
                          {project.location && (
                            <p className="text-sm text-muted-foreground">
                              {project.location}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(project.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Products Allocated</span>
                          </div>
                          <span className="text-lg font-bold">{stats.totalProducts}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Pending Requests</span>
                          </div>
                          <span className="text-lg font-bold">{stats.pendingRequests}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter === 'all'
                  ? 'Create your first project to get started'
                  : `No ${statusFilter.replace('_', ' ')} projects at this time`}
              </p>
              <Button onClick={() => setIsNewProjectOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isNewProjectOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to track inventory usage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Project A - Condo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Downtown District"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as 'active' | 'on_hold' | 'completed')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Project details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createProject.isPending}>
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
