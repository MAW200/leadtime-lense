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
import { UserCog, HardHat, Warehouse } from 'lucide-react';

export const RoleToggle = () => {
  const { currentRole, setCurrentRole, userName } = useRole();

  const getRoleIcon = () => {
    if (currentRole === 'ceo_admin') return <UserCog className="h-4 w-4" />;
    if (currentRole === 'warehouse_admin') return <Warehouse className="h-4 w-4" />;
    return <HardHat className="h-4 w-4" />;
  };

  const getRoleLabel = () => {
    if (currentRole === 'ceo_admin') return 'CEO Admin';
    if (currentRole === 'warehouse_admin') return 'Warehouse';
    return 'Onsite';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {getRoleIcon()}
          <span className="hidden sm:inline">{userName}</span>
          <Badge
            variant={currentRole === 'ceo_admin' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {getRoleLabel()}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch View</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setCurrentRole('ceo_admin')}
          className="cursor-pointer"
        >
          <UserCog className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">CEO Admin View</span>
            <span className="text-xs text-muted-foreground">
              Full dashboard access
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setCurrentRole('warehouse_admin')}
          className="cursor-pointer"
        >
          <Warehouse className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">Warehouse Admin View</span>
            <span className="text-xs text-muted-foreground">
              Review & approve claims
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setCurrentRole('onsite_team')}
          className="cursor-pointer"
        >
          <HardHat className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">Onsite Team View</span>
            <span className="text-xs text-muted-foreground">
              Manage project claims
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
