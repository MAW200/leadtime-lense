import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Package,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Requests', href: '/requests', icon: FileText },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Inventory</h1>
            <p className="text-xs text-muted-foreground">Action Center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5', isActive && 'text-primary-foreground')} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground text-center">
          v1.0.0
        </div>
      </div>
    </div>
  );
};
