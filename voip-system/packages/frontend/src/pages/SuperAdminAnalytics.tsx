import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  ArrowLeft,
  Download,
  Filter,
  TrendingUp,
  Phone,
  Users,
  Building2,
  Activity,
  AlertCircle
} from 'lucide-react';
import apiClient from '@/lib/api';

interface CrossTenantSummary {
  total_tenants: number;
  total_users: number;
  total_extensions: number;
  total_calls: number;
  active_calls: number;
  total_companies: number;
  total_contacts: number;
  avg_call_duration: number;
  total_call_duration: number;
}

interface TenantCall {
  id: string;
  tenant_name: string;
  tenant_slug: string;
  caller_number: string;
  callee_number: string;
  start_time: string;
  duration: number;
  disposition: string;
  user_email?: string;
}

interface TenantExtension {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_status: string;
  extensions_count: number;
  active_extensions: number;
  inactive_extensions: number;
}

interface TenantUser {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_status: string;
  users_count: number;
  active_users: number;
  admin_users: number;
  regular_users: number;
  last_login?: string;
}

export default function SuperAdminAnalytics() {
  const [summary, setSummary] = useState<CrossTenantSummary | null>(null);
  const [calls, setCalls] = useState<TenantCall[]>([]);
  const [extensions, setExtensions] = useState<TenantExtension[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [period, setPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedTenant, period]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [summaryResponse, callsResponse, extensionsResponse, usersResponse] = await Promise.all([
        apiClient.getCrossTenantSummary({ period }),
        apiClient.getCrossTenantCalls({
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          tenant_id: selectedTenant === 'all' ? undefined : selectedTenant,
          limit: 100
        }),
        apiClient.getCrossTenantExtensions(),
        apiClient.getCrossTenantUsers()
      ]);

      if (summaryResponse.success) {
        setSummary(summaryResponse.data);
      }

      if (callsResponse.success) {
        setCalls(callsResponse.data || []);
      }

      if (extensionsResponse.success) {
        setExtensions(extensionsResponse.data || []);
      }

      if (usersResponse.success) {
        setUsers(usersResponse.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getDispositionBadge = (disposition: string) => {
    switch (disposition) {
      case 'ANSWERED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Answered</Badge>;
      case 'NO ANSWER':
        return <Badge variant="secondary">No Answer</Badge>;
      case 'BUSY':
        return <Badge variant="destructive">Busy</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{disposition}</Badge>;
    }
  };

  const exportData = (format: 'csv' | 'json') => {
    // TODO: Implement export functionality
    console.log(`Exporting data as ${format}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cross-Tenant Analytics</h1>
            <p className="text-gray-600">System-wide statistics and insights</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('json')}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="period">Time Period</Label>
                <select
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="tenant">Tenant</Label>
                <select
                  id="tenant"
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Tenants</option>
                  {extensions.map((ext) => (
                    <option key={ext.tenant_id} value={ext.tenant_id}>
                      {ext.tenant_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_calls}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.active_calls} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_users}</div>
                <p className="text-xs text-muted-foreground">
                  Across {summary.total_tenants} tenants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Extensions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_extensions}</div>
                <p className="text-xs text-muted-foreground">
                  VoIP extensions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(Math.round(summary.avg_call_duration || 0))}</div>
                <p className="text-xs text-muted-foreground">
                  Total: {formatDuration(Math.round(summary.total_call_duration || 0))}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Extensions by Tenant */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Extensions by Tenant</CardTitle>
            <CardDescription>Extension distribution across all tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Tenant</th>
                    <th className="text-left py-3 px-4">Total Extensions</th>
                    <th className="text-left py-3 px-4">Active</th>
                    <th className="text-left py-3 px-4">Inactive</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {extensions.map((ext) => (
                    <tr key={ext.tenant_id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{ext.tenant_name}</div>
                          <div className="text-sm text-gray-500">{ext.tenant_slug}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{ext.extensions_count}</td>
                      <td className="py-3 px-4 text-green-600">{ext.active_extensions}</td>
                      <td className="py-3 px-4 text-red-600">{ext.inactive_extensions}</td>
                      <td className="py-3 px-4">
                        <Badge variant={ext.tenant_status === 'active' ? 'default' : 'secondary'}>
                          {ext.tenant_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Users by Tenant */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Users by Tenant</CardTitle>
            <CardDescription>User distribution and roles across all tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Tenant</th>
                    <th className="text-left py-3 px-4">Total Users</th>
                    <th className="text-left py-3 px-4">Active</th>
                    <th className="text-left py-3 px-4">Admins</th>
                    <th className="text-left py-3 px-4">Regular Users</th>
                    <th className="text-left py-3 px-4">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.tenant_id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{user.tenant_name}</div>
                          <div className="text-sm text-gray-500">{user.tenant_slug}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{user.users_count}</td>
                      <td className="py-3 px-4 text-green-600">{user.active_users}</td>
                      <td className="py-3 px-4 text-blue-600">{user.admin_users}</td>
                      <td className="py-3 px-4 text-gray-600">{user.regular_users}</td>
                      <td className="py-3 px-4">
                        {user.last_login ? (
                          <div>
                            <div className="text-sm">{new Date(user.last_login).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(user.last_login).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>Latest call activity across all tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Tenant</th>
                    <th className="text-left py-3 px-4">Caller</th>
                    <th className="text-left py-3 px-4">Callee</th>
                    <th className="text-left py-3 px-4">Start Time</th>
                    <th className="text-left py-3 px-4">Duration</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">User</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr key={call.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{call.tenant_name}</div>
                          <div className="text-sm text-gray-500">{call.tenant_slug}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{call.caller_number}</td>
                      <td className="py-3 px-4">{call.callee_number}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-sm">{new Date(call.start_time).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(call.start_time).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{formatDuration(call.duration)}</td>
                      <td className="py-3 px-4">{getDispositionBadge(call.disposition)}</td>
                      <td className="py-3 px-4">
                        {call.user_email ? (
                          <span className="text-sm text-gray-600">{call.user_email}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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
