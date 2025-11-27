import { useRole } from '@/contexts/RoleContext';
import { ROLE_PERMISSIONS, type UserRole } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LogOut, 
  ArrowRightLeft, 
  Settings, 
  UserCog,
  Shield,
  ShoppingCart,
  Wallet,
  Warehouse,
  HardHat,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Role icons mapping
const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  ceo_admin: Shield,
  purchaser: ShoppingCart,
  finance_admin: Wallet,
  warehouse_admin: Warehouse,
  onsite_team: HardHat,
};

// Role colors for badges
const roleColors: Record<UserRole, string> = {
  ceo_admin: 'bg-purple-600 text-white',
  purchaser: 'bg-blue-600 text-white',
  finance_admin: 'bg-green-600 text-white',
  warehouse_admin: 'bg-amber-600 text-white',
  onsite_team: 'bg-orange-600 text-white',
};

// Default routes for each role
const roleDefaultRoutes: Record<UserRole, string> = {
  ceo_admin: '/',
  purchaser: '/purchase-orders',
  finance_admin: '/purchase-orders',
  warehouse_admin: '/warehouse/pending-claims',
  onsite_team: '/onsite/projects',
};

export const UserProfileMenu = () => {
  const {
    currentRole,
    actualRole,
    setCurrentRole,
    isPreviewMode,
    exitPreviewMode,
    userName,
    userId,
    isAdmin,
  } = useRole();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: UserRole) => ROLE_PERMISSIONS[role]?.label ?? 'User';
  const CurrentRoleIcon = roleIcons[currentRole];

  const handleSwitchRole = (role: UserRole) => {
    setCurrentRole(role);
    navigate(roleDefaultRoutes[role]);
  };

  const handleReturnToAdmin = () => {
    exitPreviewMode();
    navigate('/');
  };

  const handleLogout = () => {
    // Implement logout logic
    navigate('/login');
  };

  // All available roles for switching (only admins can switch to any role)
  const switchableRoles: UserRole[] = isAdmin 
    ? ['ceo_admin', 'purchaser', 'finance_admin', 'warehouse_admin', 'onsite_team']
    : [actualRole];

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
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">Logged in as:</p>
            <p className="text-sm font-semibold">{userName}</p>
            <p className="text-xs font-mono text-muted-foreground break-all">ID: {userId}</p>
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {getRoleLabel(actualRole)}
              </Badge>
            </div>
            {isPreviewMode && (
              <div className="flex items-center gap-2 pt-1">
                <p className="text-xs text-muted-foreground">Viewing as:</p>
                <Badge className={`text-xs ${roleColors[currentRole]}`}>
                  <CurrentRoleIcon className="h-3 w-3 mr-1" />
                  {getRoleLabel(currentRole)}
                </Badge>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/login')} className="cursor-pointer">
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Switch Identity
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {isPreviewMode ? (
          <DropdownMenuItem 
            onClick={handleReturnToAdmin} 
            className="cursor-pointer text-primary focus:text-primary"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Return to Admin View
          </DropdownMenuItem>
        ) : isAdmin ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wide">
              Switch View
            </DropdownMenuLabel>
            {switchableRoles.map((role) => {
              const RoleIcon = roleIcons[role];
              const isSelected = currentRole === role;
              const roleInfo = ROLE_PERMISSIONS[role];
              
              return (
                <DropdownMenuItem 
                  key={role}
                  onClick={() => handleSwitchRole(role)} 
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`p-1.5 rounded ${roleColors[role]}`}>
                      <RoleIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{roleInfo.label}</p>
                      <p className="text-xs text-muted-foreground">{roleInfo.description}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-green-600" />}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ) : null}

        <DropdownMenuSeparator />

        {(isAdmin && !isPreviewMode) && (
          <>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
