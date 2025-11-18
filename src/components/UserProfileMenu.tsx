import { useRole } from '@/contexts/RoleContext';
import type { UserRole } from '@/lib/supabase';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LogOut, ArrowRightLeft, Settings, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserProfileMenu = () => {
  const { currentRole, actualRole, setCurrentRole, isPreviewMode, exitPreviewMode, userName } = useRole();
  const navigate = useNavigate();

  const isCEOAdmin = actualRole === 'ceo_admin';
  const roleLabels: Record<UserRole, string> = {
    ceo_admin: 'CEO/Admin',
    warehouse_admin: 'Warehouse Admin',
    onsite_team: 'Onsite Team',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: UserRole) => roleLabels[role] ?? 'Admin';

  const handleSwitchToWarehouse = () => {
    setCurrentRole('warehouse_admin');
    navigate('/warehouse/pending-claims');
  };

  const handleSwitchToOnsite = () => {
    setCurrentRole('onsite_team');
    navigate('/onsite/projects');
  };

  const handleReturnToAdmin = () => {
    exitPreviewMode();
    navigate('/');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">Logged in as:</p>
            <p className="text-sm font-semibold">{userName}</p>
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {getRoleLabel(actualRole)}
              </Badge>
            </div>
            {isPreviewMode && (
              <div className="flex items-center gap-2 pt-1">
                <p className="text-xs text-muted-foreground">Viewing as:</p>
                <Badge variant="secondary" className="text-xs capitalize">
                  {getRoleLabel(currentRole)}
                </Badge>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isPreviewMode ? (
          <DropdownMenuItem onClick={handleReturnToAdmin} className="cursor-pointer text-primary focus:text-primary">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Return to Admin View
          </DropdownMenuItem>
        ) : isCEOAdmin ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wide">
              View As
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={handleSwitchToWarehouse} className="cursor-pointer">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Switch to Warehouse Admin View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSwitchToOnsite} className="cursor-pointer">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Switch to Onsite Team View
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : null}

        <DropdownMenuSeparator />

        {(isCEOAdmin && !isPreviewMode) && (
          <>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
