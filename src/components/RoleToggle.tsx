import { useRole } from '@/contexts/RoleContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { User, UserCog, HardHat } from 'lucide-react';

export const RoleToggle = () => {
  const { currentRole, setCurrentRole, userName } = useRole();

  const isAdmin = currentRole === 'admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {isAdmin ? (
            <UserCog className="h-4 w-4" />
          ) : (
            <HardHat className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{userName}</span>
          <Badge
            variant={isAdmin ? 'default' : 'secondary'}
            className="text-xs"
          >
            {isAdmin ? 'Admin' : 'Onsite'}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch View</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setCurrentRole('admin')}
          className="cursor-pointer"
        >
          <UserCog className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">Admin View</span>
            <span className="text-xs text-muted-foreground">
              Full dashboard access
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setCurrentRole('onsite_team')}
          className="cursor-pointer"
        >
          <HardHat className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">Onsite View</span>
            <span className="text-xs text-muted-foreground">
              Browse & claim inventory
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
