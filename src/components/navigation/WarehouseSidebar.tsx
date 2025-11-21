import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Warehouse,
  ClipboardList,
  History,
  Undo2,
  SlidersHorizontal,
} from 'lucide-react';

const warehouseNavigation = [
  { name: 'Pending Claims', href: '/warehouse/pending-claims', icon: ClipboardList },
  { name: 'Pending Returns', href: '/warehouse/pending-returns', icon: Undo2 },
  { name: 'Stock Adjustments', href: '/warehouse/stock-adjustments', icon: SlidersHorizontal },
  { name: 'Claim History', href: '/warehouse/claim-history', icon: History },
];

export const WarehouseSidebar = () => {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/90 p-2">
            <Warehouse className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Warehouse Control</h1>
            <p className="text-xs text-muted-foreground">Admin Operations</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
          Operations
        </p>
        <nav className="mt-2 space-y-1">
          {warehouseNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary',
                    )}
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground text-center">
          Warehouse View v1.0.0
        </div>
      </div>
    </div>
  );
};
