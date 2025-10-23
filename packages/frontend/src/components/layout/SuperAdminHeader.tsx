import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  Terminal,
  LogOut,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/edgvoip/dashboard', icon: LayoutDashboard },
  { name: 'Tenants', href: '/edgvoip/tenants', icon: Building2 },
  { name: 'Users', href: '/edgvoip/users', icon: Users },
  { name: 'Analytics', href: '/edgvoip/analytics', icon: BarChart3 },
  { name: 'System Settings', href: '/edgvoip/system-settings', icon: Settings },
  { name: 'Logs', href: '/edgvoip/logs', icon: Terminal },
];

export default function SuperAdminHeader() {
  const { logout, user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center">
              <Phone className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">EDG VoIP</span>
              <span className="ml-2 text-sm text-gray-500">Super Admin</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                  }`
                }
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'S'}
                </span>
                </div>
              </div>
              <div className="ml-3 hidden sm:block">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                </p>
                <p className="text-xs text-gray-500">Super Administrator</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="ml-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}
