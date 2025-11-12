import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Warehouse, ClipboardList, History } from 'lucide-react';

const warehouseNavigation = [
  { name: 'Pending Claims', href: '/warehouse/pending-claims', icon: ClipboardList },
  { name: 'Claim History', href: '/warehouse/claim-history', icon: History },
];

export const WarehouseSidebar = () => {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Warehouse className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Inventory</h1>
            <p className="text-xs text-muted-foreground">Warehouse Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {warehouseNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
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
          Warehouse View v1.0.0
        </div>
      </div>
    </div>
  );
};
