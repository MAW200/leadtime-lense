import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRole } from '@/contexts/RoleContext';
import { useUserProjects } from '@/hooks/useUserProjects';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const ProjectAssignmentsWidget = () => {
  const { userId } = useRole();
  const { data: assignments, isLoading } = useUserProjects(userId);
  const navigate = useNavigate();

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Projects</CardTitle>
        <p className="text-sm text-muted-foreground">
          Projects you are currently responsible for. Click a card in My Projects to drill down.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignments && assignments.length > 0 ? (
          assignments.slice(0, 4).map((assignment) => (
            <div key={assignment.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{assignment.project?.name || 'Untitled Project'}</p>
                  <p className="text-xs text-muted-foreground">
                    Assigned {format(new Date(assignment.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {assignment.project?.status || 'active'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/onsite/projects/${assignment.project_id}`)}
                >
                  View BOM
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate(`/onsite/projects/${assignment.project_id}?claim=true`)}
                >
                  Claim Materials
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">You don’t have any assigned projects yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

