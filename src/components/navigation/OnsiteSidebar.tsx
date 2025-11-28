import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Package, HardHat, LayoutDashboard } from 'lucide-react';

const onsiteNavigation = [
  { name: 'Dashboard', href: '/onsite/dashboard', icon: LayoutDashboard },
  { name: 'My Projects', href: '/onsite/projects', icon: Package },
];

export const OnsiteSidebar = () => {
  return (
    <>
      {/* macOS Dynamic Island Style Navigation - Onsite Theme (Orange) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <nav className="relative">
          {/* Glassmorphism Container */}
          <div className="relative backdrop-blur-2xl bg-sidebar/80 border border-sidebar-border/30 rounded-full shadow-2xl shadow-black/20 px-3 py-2">
            {/* Logo Section - Orange Theme */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2">
              <NavLink
                to="/"
                className="block cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95"
              >
                <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-3 rounded-full shadow-lg shadow-orange-500/30 border-2 border-background">
                  <HardHat className="h-5 w-5 text-white" />
                </div>
              </NavLink>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center gap-1 pl-12 pr-2">
              {onsiteNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300',
                      'hover:bg-white/10',
                      isActive
                        ? 'bg-gradient-to-r from-orange-500/90 via-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/30'
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
                        "transition-all",
                        isActive && 'font-semibold'
                      )}>
                        {item.name}
                      </span>
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/20 via-orange-600/20 to-red-600/20 blur-xl -z-10" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              {/* Badge */}
              <div className="ml-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                <span className="text-xs font-medium text-orange-500">Onsite</span>
              </div>
            </div>

            {/* Subtle shine effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>

          {/* Shadow enhancement */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-orange-500/5 to-transparent blur-2xl -z-10" />
        </nav>
      </div>

      {/* Spacer to prevent content from going under the nav */}
      <div className="h-20" />
    </>
  );
};
