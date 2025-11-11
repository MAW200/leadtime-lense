import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Package, FileText, HardHat } from 'lucide-react';

const onsiteNavigation = [
  { name: 'Browse Inventory', href: '/onsite/browse', icon: Package },
  { name: 'My Requests', href: '/onsite/requests', icon: FileText },
];

export const OnsiteSidebar = () => {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-2 rounded-lg">
            <HardHat className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Inventory</h1>
            <p className="text-xs text-muted-foreground">Onsite Team</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {onsiteNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5', isActive && 'text-white')} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground text-center">
          Onsite View v1.0.0
        </div>
      </div>
    </div>
  );
};
