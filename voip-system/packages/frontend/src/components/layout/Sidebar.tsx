import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  Phone, 
  Activity, 
  FileText, 
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Network,
  BookOpen,
  Terminal,
  Users2,
  Clock,
  Menu,
  MessageSquare,
  Mic,
  BarChart3,
  Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Navigation based on user role
const getNavigationForRole = (role: string, tenantSlug: string) => {
  const baseNavigation = [
    { name: 'Dashboard', href: `/${tenantSlug}/dashboard`, icon: LayoutDashboard, level: 0 },
  ];

  if (role === 'super_admin') {
    return [
      { name: 'Dashboard', href: '/edgvoip/dashboard', icon: LayoutDashboard, level: 0 },
      { name: 'Tenants', href: '/edgvoip/tenants', icon: Users, level: 0 },
      { name: 'Users', href: '/edgvoip/users', icon: Users, level: 0 },
      { name: 'Analytics', href: '/edgvoip/analytics', icon: BarChart3, level: 0 },
      { name: 'System Settings', href: '/edgvoip/system-settings', icon: Settings, level: 0 },
      { name: 'Logs', href: '/edgvoip/logs', icon: Terminal, level: 0 },
    ];
  } else if (role === 'tenant_admin') {
    return [
      ...baseNavigation,
      { 
        name: 'Tenant Management', 
        icon: Users, 
        level: 0,
        children: [
          { name: 'Stores', href: `/${tenantSlug}/stores`, icon: Building, level: 1 },
          { name: 'Users', href: `/${tenantSlug}/users`, icon: Users, level: 1 },
        ]
      },
          {
            name: 'VoIP Management',
            icon: Phone,
            level: 0,
            children: [
              { name: 'Extensions', href: `/${tenantSlug}/extensions`, icon: Phone, level: 1 },
              { name: 'SIP Trunks', href: `/${tenantSlug}/sip-trunks`, icon: Network, level: 1 },
              { name: 'Ring Groups', href: `/${tenantSlug}/ring-groups`, icon: Users2, level: 1 },
              { name: 'Call Queues', href: `/${tenantSlug}/queues`, icon: Headphones, level: 1 },
              { name: 'IVR Menus', href: `/${tenantSlug}/ivr-menus`, icon: Menu, level: 1 },
              { name: 'Conference Rooms', href: `/${tenantSlug}/conference-rooms`, icon: MessageSquare, level: 1 },
              { name: 'Voicemail', href: `/${tenantSlug}/voicemail`, icon: Mic, level: 1 },
              { name: 'Time Conditions', href: `/${tenantSlug}/time-conditions`, icon: Clock, level: 1 },
            ]
      },
      { name: 'Live Calls', href: `/${tenantSlug}/live-calls`, icon: Activity, level: 0 },
      { name: 'CDR & Analytics', href: `/${tenantSlug}/cdr`, icon: BarChart3, level: 0 },
      { name: 'Logs & Verbose', href: `/${tenantSlug}/logs`, icon: Terminal, level: 0 },
    ];
  } else {
    // tenant_user
    return [
      ...baseNavigation,
      { name: 'My Extensions', href: '/my-extensions', icon: Phone, level: 0 },
      { name: 'Make Call', href: '/make-call', icon: Phone, level: 0 },
      { name: 'My CDR', href: '/my-cdr', icon: FileText, level: 0 },
    ];
  }
};

export default function Sidebar() {
  const { logout, user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const autoCollapseTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Get navigation based on user role
  const navigation = user ? getNavigationForRole(user.role, user.tenantSlug) : [];
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Auto-collapse logic
  useEffect(() => {
    if (isMobile) return;
    
    const startAutoCollapse = () => {
      if (autoCollapseTimer.current) {
        clearTimeout(autoCollapseTimer.current);
      }
      autoCollapseTimer.current = setTimeout(() => {
        if (!isHovered) {
          setIsCollapsed(true);
          // Emit event when auto-collapsing
          const event = new CustomEvent('sidebar-state-change', {
            detail: { collapsed: true }
          });
          window.dispatchEvent(event);
        }
      }, 3000);
    };
    
    if (!isCollapsed) {
      startAutoCollapse();
    }
    
    return () => {
      if (autoCollapseTimer.current) {
        clearTimeout(autoCollapseTimer.current);
      }
    };
  }, [isCollapsed, isHovered, isMobile]);
  
  // Set default expanded items based on role
  React.useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') {
        setExpandedItems(['System Management', 'VoIP Management']);
      } else if (user.role === 'tenant_admin') {
        setExpandedItems(['Tenant Management', 'VoIP Management']);
      }
    }
  }, [user]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
      if (autoCollapseTimer.current) {
        clearTimeout(autoCollapseTimer.current);
      }
      setTimeout(() => {
        if (isCollapsed) {
          setIsCollapsed(false);
          // Emit event when expanding on hover
          const event = new CustomEvent('sidebar-state-change', {
            detail: { collapsed: false }
          });
          window.dispatchEvent(event);
        }
      }, 200);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
    }
  };

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // Emit custom event to notify layout
    const event = new CustomEvent('sidebar-state-change', {
      detail: { collapsed: newCollapsedState }
    });
    window.dispatchEvent(event);
  };

  const renderNavItem = (item: any) => {
    if (item.children) {
      const isExpanded = expandedItems.includes(item.name);
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name)}
            className={cn(
              "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md",
              "text-gray-600 hover:bg-blue-50/50 hover:text-blue-700",
              "hover:translate-x-1 transition-all duration-200 ease-smooth",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className={cn("h-5 w-5 flex-shrink-0", isCollapsed ? "" : "mr-3")} />
            {!isCollapsed && (
              <>
                <span className="truncate">{item.name}</span>
                {isExpanded ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </>
            )}
          </button>
          {isExpanded && !isCollapsed && (
            <div className="ml-4 space-y-1 animate-fadeIn">
              {item.children.map((child: any) => (
                <NavLink
                  key={child.name}
                  to={child.href}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      "transition-all duration-200 ease-smooth",
                      "hover:translate-x-1 hover:bg-blue-50/50",
                      isActive
                        ? 'bg-blue-100/80 text-blue-900 shadow-sm'
                        : 'text-gray-500 hover:text-blue-700'
                    )
                  }
                >
                  <child.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                  {child.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.name}
        to={item.href}
        className={({ isActive }) =>
          cn(
            "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
            "transition-all duration-200 ease-smooth",
            "hover:translate-x-1 hover:bg-blue-50/50",
            isCollapsed && "justify-center",
            isActive
              ? 'bg-blue-100/80 text-blue-900 shadow-sm'
              : 'text-gray-600 hover:text-blue-700'
          )
        }
        title={isCollapsed ? item.name : undefined}
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0", isCollapsed ? "" : "mr-3")} />
        {!isCollapsed && <span className="truncate">{item.name}</span>}
      </NavLink>
    );
  };

  return (
    <div 
      className={cn(
        "hidden md:flex md:flex-col fixed left-0 top-0 h-full z-40",
        "glass-nav transition-all duration-300 ease-smooth",
        isCollapsed ? "w-16" : "w-64"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
        {/* Header with logo and toggle */}
        <div className="flex items-center justify-between flex-shrink-0 px-4">
          <div className="flex items-center">
            <Phone className="h-8 w-8 text-blue-600" />
            {!isCollapsed && (
              <span className="ml-2 text-xl font-bold text-gray-900 animate-fadeIn">
                EDG VoIP
              </span>
            )}
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="p-1 hover:bg-white/50 hover:scale-105 transition-all duration-200"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {/* Navigation */}
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map(renderNavItem)}
          </nav>
        </div>

        {/* User section */}
        <div className="flex-shrink-0 flex border-t border-white/20 p-4">
          <div className="flex items-center w-full">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <span className="text-sm font-medium text-white">
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex-1 animate-fadeIn">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role === 'super_admin' && 'Super Administrator'}
                  {user?.role === 'tenant_admin' && `Tenant Admin • ${user?.tenantId?.slice(0, 8)}...`}
                  {user?.role === 'user' && `User • ${user?.tenantId?.slice(0, 8)}...`}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className={cn(
                "hover:bg-white/50 hover:scale-105 transition-all duration-200",
                isCollapsed ? "ml-0" : "ml-2"
              )}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}