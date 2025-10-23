import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Phone, 
  Activity, 
  Plus, 
  Eye, 
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import apiClient from '@/lib/api';

interface CrossTenantStats {
  total_tenants: number;
  total_users: number;
  total_extensions: number;
  total_calls_24h: number;
  active_tenants: number;
  inactive_tenants: number;
}

interface TenantStats {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  users_count: number;
  extensions_count: number;
  calls_24h: number;
  companies_count: number;
  contacts_count: number;
  status: string;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<CrossTenantStats | null>(null);
  const [tenantStats, setTenantStats] = useState<TenantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, tenantStatsResponse] = await Promise.all([
        apiClient.getCrossTenantStats(),
        apiClient.getTenantStatsList()
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (tenantStatsResponse.success) {
        setTenantStats(tenantStatsResponse.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    apiClient.clearToken();
    navigate('/edgvoip/login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadDashboardData} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Cross-tenant Management Dashboard</h1>
          <p className="text-gray-600">Overview of all tenants and system statistics</p>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_tenants || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.active_tenants || 0} active, {stats?.inactive_tenants || 0} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all tenants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Extensions</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_extensions || 0}</div>
              <p className="text-xs text-muted-foreground">
                VoIP extensions configured
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calls (24h)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_calls_24h || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => navigate('/edgvoip/tenants?action=create')}
                >
                  <Plus className="h-6 w-6 mb-2" />
                  <span>Create New Tenant</span>
                </Button>
                <Button 
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => navigate('/edgvoip/tenants')}
                >
                  <Eye className="h-6 w-6 mb-2" />
                  <span>View All Tenants</span>
                </Button>
                <Button 
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => navigate('/edgvoip/analytics')}
                >
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span>View Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenant Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Overview</CardTitle>
            <CardDescription>Summary of all tenants in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Tenant</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Users</th>
                    <th className="text-left py-3 px-4">Extensions</th>
                    <th className="text-left py-3 px-4">Companies</th>
                    <th className="text-left py-3 px-4">Calls (24h)</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantStats.map((tenant) => (
                    <tr key={tenant.tenant_id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{tenant.tenant_name}</div>
                          <div className="text-sm text-gray-500">{tenant.tenant_slug}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(tenant.status)}
                      </td>
                      <td className="py-3 px-4">{tenant.users_count}</td>
                      <td className="py-3 px-4">{tenant.extensions_count}</td>
                      <td className="py-3 px-4">{tenant.companies_count}</td>
                      <td className="py-3 px-4">{tenant.calls_24h}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/edgvoip/tenants/${tenant.tenant_id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/edgvoip/tenants/${tenant.tenant_id}/users`)}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Users
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}