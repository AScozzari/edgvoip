import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Building2, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Users,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import apiClient from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  sip_domain: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TenantWithDetails extends Tenant {
  companies: Array<{
    id: string;
    legal_name: string;
    vat_number?: string;
    address?: string;
    city?: string;
    is_primary: boolean;
  }>;
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    role?: string;
    is_primary: boolean;
  }>;
}

export default function SuperAdminTenants() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithDetails | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTenants();
      setTenants((response.data as any)?.tenants || []);
    } catch (error: any) {
      setError(error.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTenant = async (tenant: Tenant) => {
    try {
      const response = await apiClient.getTenantWithDetails(tenant.id);
      setSelectedTenant(response.data as TenantWithDetails);
      setShowDetailsModal(true);
    } catch (error: any) {
      setError(error.message || 'Failed to load tenant details');
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant?')) {
      return;
    }

    try {
      await apiClient.deleteTenant(tenantId);
      await loadTenants();
    } catch (error: any) {
      setError(error.message || 'Failed to delete tenant');
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.sip_domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
            <p className="text-gray-600">Manage all tenants in the system</p>
          </div>
          <Button onClick={() => navigate('/edgvoip/tenants/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tenant
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tenants Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tenants</CardTitle>
            <CardDescription>
              Manage tenant configurations and access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Domain</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">SIP Domain</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{tenant.name}</div>
                        <div className="text-sm text-gray-500">Slug: {tenant.slug}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{tenant.domain}</td>
                      <td className="py-3 px-4 text-gray-900">{tenant.sip_domain}</td>
                      <td className="py-3 px-4">{getStatusBadge(tenant.status)}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTenant(tenant)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/edgvoip/tenants/${tenant.id}/users`)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Tenant Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected tenant
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">{selectedTenant.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Slug</label>
                      <p className="text-gray-900">{selectedTenant.slug}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Domain</label>
                      <p className="text-gray-900">{selectedTenant.domain}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">SIP Domain</label>
                      <p className="text-gray-900">{selectedTenant.sip_domain}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedTenant.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="text-gray-900">
                        {new Date(selectedTenant.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Companies */}
              {selectedTenant.companies && selectedTenant.companies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Companies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedTenant.companies.map((company) => (
                        <div key={company.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{company.legal_name}</h4>
                            {company.is_primary && (
                              <Badge variant="secondary">Primary</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {company.vat_number && (
                              <div>
                                <span className="text-gray-500">VAT:</span> {company.vat_number}
                              </div>
                            )}
                            {company.address && (
                              <div>
                                <span className="text-gray-500">Address:</span> {company.address}
                              </div>
                            )}
                            {company.city && (
                              <div>
                                <span className="text-gray-500">City:</span> {company.city}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contacts */}
              {selectedTenant.contacts && selectedTenant.contacts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contacts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedTenant.contacts.map((contact) => (
                        <div key={contact.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">
                              {contact.first_name} {contact.last_name}
                            </h4>
                            {contact.is_primary && (
                              <Badge variant="secondary">Primary</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {contact.role && (
                              <div>
                                <span className="text-gray-500">Role:</span> {contact.role}
                              </div>
                            )}
                            {contact.email && (
                              <div>
                                <span className="text-gray-500">Email:</span> {contact.email}
                              </div>
                            )}
                            {contact.phone && (
                              <div>
                                <span className="text-gray-500">Phone:</span> {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}