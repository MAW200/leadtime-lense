import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ONSITE_TEAM_MEMBERS } from '@/data/mockUsers';
import { useAssignUserToProject, useProjectUsers, useRemoveUserFromProject } from '@/hooks/useUserProjects';
import { Check, Loader2, Users } from 'lucide-react';

type AssignOnsiteModalProps = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
};

export const AssignOnsiteModal = ({ projectId, isOpen, onClose }: AssignOnsiteModalProps) => {
  const { data: projectUsers, isLoading } = useProjectUsers(projectId);
  const assignUser = useAssignUserToProject();
  const removeUser = useRemoveUserFromProject();

  const assignedMap = new Map(projectUsers?.map((assignment) => [assignment.user_id, assignment]) || []);

  const handleAssign = (userId: string) => {
    assignUser.mutate({ userId, projectId });
  };

  const handleRemove = (userId: string) => {
    const assignment = assignedMap.get(userId);
    if (!assignment) return;
    removeUser.mutate({ assignmentId: assignment.id, projectId, userId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Onsite Team</DialogTitle>
          <DialogDescription>
            Control which onsite teammates can access this project in their dashboard. Assigned users will be able to view
            the BOM and submit claims.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {projectUsers?.length || 0} teammate(s) currently assigned
          </div>
          <Separator />

          <ScrollArea className="h-80 rounded-md border">
            <div className="divide-y">
              {ONSITE_TEAM_MEMBERS.map((member) => {
                const isAssigned = assignedMap.has(member.id);
                const isMutating =
                  assignUser.isPending || removeUser.isPending
                    ? assignUser.variables?.userId === member.id || removeUser.variables?.userId === member.id
                    : false;

                return (
                  <div key={member.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {isAssigned ? (
                        <Badge className="bg-green-500 text-white flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Assigned
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not assigned</Badge>
                      )}
                      <Button
                        variant={isAssigned ? 'outline' : 'default'}
                        size="sm"
                        disabled={isMutating}
                        onClick={() => (isAssigned ? handleRemove(member.id) : handleAssign(member.id))}
                      >
                        {isMutating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isAssigned ? (
                          'Remove'
                        ) : (
                          'Assign'
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

