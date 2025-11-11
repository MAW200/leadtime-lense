import { useRole } from '@/contexts/RoleContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { User, LogOut, ArrowRightLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserProfileMenu = () => {
  const { currentRole, setCurrentRole, userName } = useRole();
  const navigate = useNavigate();

  const isAdmin = currentRole === 'admin';
  const isOnsite = currentRole === 'onsite_team';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSwitchToAdmin = () => {
    setCurrentRole('admin');
    navigate('/');
  };

  const handleSwitchToOnsite = () => {
    setCurrentRole('onsite_team');
    navigate('/onsite/browse');
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
              <p className="text-xs text-muted-foreground">Role:</p>
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs">
                {isAdmin ? 'Admin' : 'Onsite Team'}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isOnsite ? (
          <DropdownMenuItem onClick={handleSwitchToAdmin} className="cursor-pointer">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Switch to Admin View
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleSwitchToOnsite} className="cursor-pointer">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Preview as Onsite Team
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {isAdmin && (
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
