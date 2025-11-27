import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  FolderKanban,
  ClipboardList,
  FileStack,
  Building2,
  Receipt,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  // Which permission is required to see this link
  requiresPurchasing?: boolean;
  requiresFinance?: boolean;
  requiresWarehouse?: boolean;
  requiresOnsite?: boolean;
  requiresAdmin?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Orders', href: '/purchase-orders', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
  // Vendors visible to Purchaser, Finance, and Admin
  { name: 'Vendors', href: '/vendors', icon: Building2, requiresPurchasing: true, requiresFinance: true },
  // Invoices visible only to Finance and Admin
  { name: 'Invoices', href: '/invoices', icon: Receipt, requiresFinance: true },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Templates', href: '/project-templates', icon: FileStack },
  { name: 'Audit', href: '/audit-log', icon: ClipboardList },
  { name: 'Settings', href: '/settings', icon: Settings, requiresAdmin: true },
];

export const Sidebar = () => {
  const { 
    canAccessPurchasing, 
    canAccessFinance, 
    canAccessWarehouse, 
    canAccessOnsite,
    isAdmin 
  } = useRole();

  // Filter navigation items based on permissions
  const filteredNavigation = navigation.filter((item) => {
    // If no requirements, show to everyone
    if (!item.requiresPurchasing && !item.requiresFinance && !item.requiresWarehouse && !item.requiresOnsite && !item.requiresAdmin) {
      return true;
    }
    
    // Check specific permissions
    if (item.requiresAdmin && isAdmin) return true;
    if (item.requiresPurchasing && canAccessPurchasing) return true;
    if (item.requiresFinance && canAccessFinance) return true;
    if (item.requiresWarehouse && canAccessWarehouse) return true;
    if (item.requiresOnsite && canAccessOnsite) return true;
    
    return false;
  });

  return (
    <>
      {/* macOS Dynamic Island Style Navigation */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <nav className="relative">
          {/* Glassmorphism Container */}
          <div className="relative backdrop-blur-2xl bg-sidebar/80 border border-sidebar-border/30 rounded-full shadow-2xl shadow-black/20 px-3 py-2">
            {/* Logo Section */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-br from-primary via-blue-600 to-purple-600 p-3 rounded-full shadow-lg shadow-primary/30 border-2 border-background">
                <Package className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center gap-1 pl-12 pr-2">
              {filteredNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300',
                      'hover:bg-white/10',
                      isActive
                        ? 'bg-gradient-to-r from-primary/90 via-blue-600 to-purple-600 text-white shadow-lg shadow-primary/30'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          'h-4 w-4 transition-all duration-300',
                          isActive ? 'text-white scale-110' : 'text-sidebar-foreground/70',
                          'group-hover:scale-110'
                        )}
                      />
                      <span className={cn(
                        "hidden md:inline-block transition-all",
                        isActive && 'font-semibold'
                      )}>
                        {item.name}
                      </span>
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-blue-600/20 to-purple-600/20 blur-xl -z-10" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Subtle shine effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>

          {/* Shadow enhancement */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-primary/5 to-transparent blur-2xl -z-10" />
        </nav>
      </div>

      {/* Spacer to prevent content from going under the nav */}
      <div className="h-20" />
    </>
  );
};
