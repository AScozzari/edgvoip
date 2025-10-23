import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  ArrowLeft,
  UserCheck,
  Edit,
  Trash2,
  AlertCircle,
  Shield,
  Building2
} from 'lucide-react';
import apiClient from '@/lib/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  last_login?: string;
  created_at: string;
}

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [impersonating, setImpersonating] = useState(false);
  const navigate = useNavigate();
  const { tenantId } = useParams();

  useEffect(() => {
    loadUsers();
  }, [tenantId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCrossTenantUsers();
      if (response.success) {
        setUsers(response.data || []);
      } else {
        throw new Error(response.error || 'Failed to load users');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (user: User) => {
    setSelectedUser(user);
    setShowImpersonateModal(true);
  };

  const confirmImpersonate = async () => {
    if (!selectedUser) return;

    try {
      setImpersonating(true);
      const response = await apiClient.impersonateUser(selectedUser.tenant_id, selectedUser.id);
      
      if (response.success && response.data?.token) {
        // Start impersonation
        apiClient.startImpersonation(response.data.token);
        
        // Store impersonation info
        localStorage.setItem('impersonation_info', JSON.stringify({
          originalUser: selectedUser,
          impersonatedAt: new Date().toISOString()
        }));

        // Redirect to tenant dashboard
        navigate(`/${selectedUser.tenant_slug}/dashboard`);
      } else {
        throw new Error(response.error || 'Failed to impersonate user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to impersonate user');
    } finally {
      setImpersonating(false);
      setShowImpersonateModal(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Super Admin</Badge>;
      case 'tenant_admin':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Tenant Admin</Badge>;
      case 'user':
        return <Badge variant="secondary">User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tenant_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTenant = selectedTenant === 'all' || user.tenant_id === selectedTenant;
    
    return matchesSearch && matchesTenant;
  });

  const uniqueTenants = Array.from(new Set(users.map(user => user.tenant_id)))
    .map(id => users.find(user => user.tenant_id === id))
    .filter(Boolean) as User[];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users across all tenants</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name, email, or tenant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-64">
                <Label htmlFor="tenant-filter">Filter by Tenant</Label>
                <select
                  id="tenant-filter"
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Tenants</option>
                  {uniqueTenants.map((user) => (
                    <option key={user.tenant_id} value={user.tenant_id}>
                      {user.tenant_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Manage user accounts and permissions across tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Tenant</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Last Login</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{user.tenant_name}</div>
                          <div className="text-sm text-gray-500">{user.tenant_slug}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(user.status)}
                      </td>
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
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {user.role !== 'super_admin' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleImpersonate(user)}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Impersonate
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/edgvoip/users/${user.id}/edit`)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {user.role !== 'super_admin' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this user?')) {
                                  // TODO: Implement delete user
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          )}
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

      {/* Impersonation Confirmation Modal */}
      <Dialog open={showImpersonateModal} onOpenChange={setShowImpersonateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Impersonation</DialogTitle>
            <DialogDescription>
              You are about to impersonate this user. This will log you in as them and give you access to their tenant.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</h4>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedUser.tenant_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{getRoleBadge(selectedUser.role)}</span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You will be redirected to their tenant dashboard. You can exit impersonation at any time using the banner at the top of the page.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImpersonateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmImpersonate} 
              disabled={impersonating}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {impersonating ? 'Impersonating...' : 'Confirm Impersonation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
