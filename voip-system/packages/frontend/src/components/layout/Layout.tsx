import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import SuperAdminHeader from './SuperAdminHeader';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  variant?: 'tenant' | 'superadmin';
}

export default function Layout({ children, variant = 'tenant' }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarStateChange = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed);
    };

    window.addEventListener('sidebar-state-change', handleSidebarStateChange as EventListener);
    return () => {
      window.removeEventListener('sidebar-state-change', handleSidebarStateChange as EventListener);
    };
  }, []);

  if (variant === 'superadmin') {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/30 dark:to-slate-900 overflow-hidden">
        <div className="flex flex-col h-full">
          <SuperAdminHeader />
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/30 dark:to-slate-900 overflow-hidden">
      <div className="flex h-full">
        <Sidebar />
        <div 
          className={cn(
            "flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-smooth",
            "min-w-0", // Prevents content overflow
            sidebarCollapsed ? "ml-16" : "ml-64"
          )}
          style={{
            width: sidebarCollapsed ? 'calc(100% - 4rem)' : 'calc(100% - 16rem)',
            maxWidth: sidebarCollapsed ? 'calc(100vw - 4rem)' : 'calc(100vw - 16rem)'
          }}
        >
          <Header />
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}