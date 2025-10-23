import { Bell, Search, Shield, Users, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function Header() {
  const { user } = useAuth();
  const [freeSwitchConnected, setFreeSwitchConnected] = useState(false);
  const [freeSwitchLoading, setFreeSwitchLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const checkFreeSwitchStatus = async () => {
    try {
      setFreeSwitchLoading(true);
      const response = await fetch('/api/freeswitch/status');
      const data = await response.json();
      const connected = Boolean((data?.data && data.data.connected) ?? data.connected);
      setFreeSwitchConnected(connected);
    } catch (error) {
      console.error('Error checking FreeSWITCH status:', error);
      setFreeSwitchConnected(false);
    } finally {
      setFreeSwitchLoading(false);
    }
  };

  const refreshFreeSwitchStatus = async () => {
    await checkFreeSwitchStatus();
  };

  useEffect(() => {
    checkFreeSwitchStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkFreeSwitchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <header className="glass-light sticky top-0 z-30 px-6 py-4 border-b border-white/20">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-gray-900">
              EDG VoIP System
              <span className={cn(
                "ml-2 text-xs px-2 py-1 rounded-full transition-all duration-200",
                sidebarCollapsed 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-green-100 text-green-700"
              )}>
                {sidebarCollapsed ? "Compact" : "Full"}
              </span>
            </h1>
            {user && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {user.role === 'super_admin' && (
                  <>
                    <Shield className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Super Admin</span>
                  </>
                )}
                {user.role === 'tenant_admin' && (
                  <>
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Tenant Admin</span>
                    {user.tenant_id && (
                      <span className="text-gray-500">• Tenant: {user.tenant_id.slice(0, 8)}...</span>
                    )}
                  </>
                )}
                {user.role === 'tenant_user' && (
                  <>
                    <User className="h-4 w-4 text-green-500" />
                    <span className="font-medium">User</span>
                    {user.tenant_id && (
                      <span className="text-gray-500">• Tenant: {user.tenant_id.slice(0, 8)}...</span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                className="glass-input pl-10 w-64 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
              />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative hover:bg-white/50 hover:scale-105 transition-all duration-200"
            >
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-bounce-smooth"
              >
                3
              </Badge>
            </Button>

            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              {/* System Online */}
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">System Online</span>
              </div>
              
              {/* FreeSWITCH Status */}
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "h-2 w-2 rounded-full transition-colors duration-200",
                  freeSwitchConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                )}></div>
                <span className={cn(
                  "text-sm transition-colors duration-200",
                  freeSwitchConnected ? 'text-gray-600' : 'text-red-600'
                )}>
                  FreeSWITCH {freeSwitchConnected ? '' : '(ESL Disabled)'}
                </span>
                <button 
                  onClick={refreshFreeSwitchStatus}
                  disabled={freeSwitchLoading}
                  className="p-1 hover:bg-white/50 hover:scale-105 rounded transition-all duration-200"
                  title={freeSwitchConnected ? "Refresh FreeSWITCH Status" : "FreeSWITCH ESL not configured"}
                >
                  <RefreshCw className={cn(
                    "h-3 w-3 text-gray-500 transition-transform duration-200",
                    freeSwitchLoading ? 'animate-spin' : 'hover:rotate-180'
                  )} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}