import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, MapPin } from 'lucide-react';
import { useUserProjects } from '@/hooks/useUserProjects';
import { useRole } from '@/contexts/RoleContext';
import { format } from 'date-fns';

const OnsiteMyProjects = () => {
  const navigate = useNavigate();
  const { userName, userId } = useRole();

  const { data: userProjects, isLoading } = useUserProjects(userId);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="My Projects"
        description="View projects assigned to you and manage material claims"
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : userProjects && userProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProjects.map((userProject) => {
              const project = userProject.project;
              if (!project) return null;

              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-orange-500"
                  onClick={() => navigate(`/onsite/projects/${project.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold mb-1">
                          {project.name}
                        </CardTitle>
                        {project.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {project.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Assigned {format(new Date(userProject.created_at), 'MMM d, yyyy')}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects assigned</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              You don't have any projects assigned yet. Contact your administrator to get assigned to projects.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnsiteMyProjects;
