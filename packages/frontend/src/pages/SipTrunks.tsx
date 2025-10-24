import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, Plus, RefreshCw, Search, Eye, Trash2, X, Save, 
  CheckCircle, XCircle, AlertCircle, Network, Server
} from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function SipTrunks() {
  const [trunks, setTrunks] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeView, setActiveView] = useState<'status' | 'trunks'>('status');
  const [sipStatusTab, setSipStatusTab] = useState<'trunks' | 'extensions'>('trunks');
  const [extensions, setExtensions] = useState<any[]>([]);
  const [extensionsLoading, setExtensionsLoading] = useState(false);

  // Load trunks on component mount
  useEffect(() => {
    loadTrunks();
    loadExtensions();
  }, []);
  const loadTrunks = async () => {
    setLoading(true);
    try {
      // Load trunks from API
      const response = await apiClient.get('/sip-trunks');
      console.log('📡 API Response:', response.data);
      
      // Handle both formats: {success: true, data: [...]} and [...]
      if ((response.data as any)?.success) {
        setTrunks((response.data as any).data);
        console.log('✅ SIP Trunks loaded successfully:', (response.data as any).data.length);
      } else if (Array.isArray(response.data)) {
        // Direct array response
        setTrunks(response.data);
        console.log('✅ SIP Trunks loaded successfully (direct array):', response.data.length);
      } else {
        // Fallback to hardcoded Messagenet trunk if API fails
        console.warn('⚠️ API response not successful, using hardcoded Messagenet trunk');
        console.log('Response data:', response.data);
      }
    } catch (error: any) {
      console.error('❌ Error loading trunks:', error.message || error);
      console.error('Backend URL:', error.config?.url);
      console.error('Status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      // Keep hardcoded Messagenet trunk as fallback
      console.log('Using hardcoded Messagenet trunk as fallback');
    } finally {
      setLoading(false);
    }
  };

  const loadExtensions = async () => {
    setExtensionsLoading(true);
    try {
      // Load extensions from API using apiClient
      const data = await apiClient.getExtensions({ limit: 100 });
      
      console.log('📡 Extensions API Response:', data);
      
      if (data?.success && data?.data?.items && Array.isArray(data.data.items)) {
        setExtensions(data.data.items);
        console.log('✅ Extensions loaded from database:', data.data.items.length);
      } else {
        console.warn('⚠️ Invalid API response format');
        setExtensions([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading extensions:', error);
      setExtensions([]);
    } finally {
      setExtensionsLoading(false);
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unregistered': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'busy': return <Phone className="h-4 w-4 text-orange-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'default';
      case 'unregistered': return 'secondary';
      case 'failed': return 'destructive';
      case 'busy': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'registered': return 'Registered';
      case 'unregistered': return 'Unregistered';
      case 'failed': return 'Failed';
      case 'busy': return 'Busy';
      default: return 'Unknown';
    }
  };

  const renderSipStatusCard = () => (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        activeView === 'status' 
          ? 'ring-2 ring-blue-500 shadow-lg' 
          : 'hover:shadow-md'
      }`} 
      onClick={() => setActiveView('status')}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">SIP Status</h3>
              <p className="text-sm text-gray-600">Monitor SIP trunk and extension registration status</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {trunks.filter(t => t.registration?.status === 'registered').length}
            </div>
            <div className="text-sm text-blue-600">Active</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSipTrunksCard = () => (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        activeView === 'trunks' 
          ? 'ring-2 ring-blue-500 shadow-lg' 
          : 'hover:shadow-md'
      }`} 
      onClick={() => setActiveView('trunks')}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Network className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">SIP Trunks</h3>
              <p className="text-sm text-gray-600">Manage SIP trunk configurations and gateway settings</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{trunks.length}</div>
            <div className="text-sm text-green-600">Total</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSipStatusView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">SIP Status Overview</h3>
        <div className="flex space-x-2">
          <Button onClick={loadTrunks} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Trunks
          </Button>
          <Button onClick={loadExtensions} variant="outline" size="sm" disabled={extensionsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${extensionsLoading ? 'animate-spin' : ''}`} />
            {extensionsLoading ? 'Loading...' : 'Refresh Extensions'}
          </Button>
        </div>
      </div>

      {/* SIP Status Submenu */}
      <div className="w-full">
        <div className="flex w-full border-b border-gray-200 mb-4">
          <button
            onClick={() => setSipStatusTab('trunks')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              sipStatusTab === 'trunks'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            SIP Status Trunks
          </button>
          <button
            onClick={() => setSipStatusTab('extensions')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              sipStatusTab === 'extensions'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            SIP Status Extensions
          </button>
        </div>
        
        <div className="mt-4 space-y-6">
          {sipStatusTab === 'trunks' && renderSipStatusTrunks()}
          {sipStatusTab === 'extensions' && renderSipStatusExtensions()}
        </div>
      </div>
    </div>
  );

  const renderSipStatusTrunks = () => (
    <>
      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {trunks.filter(t => t.registration?.status === 'registered').length}
                </div>
                <div className="text-sm text-green-600">Registered Trunks</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {trunks.filter(t => t.registration?.status === 'unregistered').length}
                </div>
                <div className="text-sm text-red-600">Unregistered Trunks</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {trunks.filter(t => t.registration?.status === 'failed').length}
                </div>
                <div className="text-sm text-yellow-600">Failed Registrations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trunk Registration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-700">Trunk Name</th>
                  <th className="text-left p-3 font-medium text-gray-700">Host</th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  <th className="text-left p-3 font-medium text-gray-700">Last Update</th>
                  <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trunks.map((trunk, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">{trunk.name}</td>
                    <td className="p-3">{trunk.sip_config?.host}:{trunk.sip_config?.port}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(trunk.status || 'UNKNOWN')}
                        <Badge variant={getStatusColor(trunk.status || 'UNKNOWN')}>
                          {getStatusLabel(trunk.status || 'UNKNOWN')}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date().toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View Details"
                          onClick={() => handleViewTrunk(trunk)}
                        >
                          <Eye className="h-4 w-4" />
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
    </>
  );

  const renderSipStatusExtensions = () => {
    // Calculate extension statistics
    const onlineCount = extensions.filter(ext => ext.status === 'registered').length;
    const offlineCount = extensions.filter(ext => ext.status === 'unregistered').length;
    const busyCount = extensions.filter(ext => ext.status === 'busy').length;

    return (
      <>
        {/* Extensions Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{onlineCount}</div>
                  <div className="text-sm text-green-600">Online Extensions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{offlineCount}</div>
                  <div className="text-sm text-red-600">Offline Extensions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{busyCount}</div>
                  <div className="text-sm text-yellow-600">Busy Extensions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extensions Status Table */}
        <Card>
          <CardHeader>
            <CardTitle>Extension Registration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-700">Extension</th>
                      <th className="text-left p-3 font-medium text-gray-700">Display Name</th>
                      <th className="text-left p-3 font-medium text-gray-700">Status</th>
                      <th className="text-left p-3 font-medium text-gray-700">Last Seen</th>
                      <th className="text-left p-3 font-medium text-gray-700">Contact</th>
                      <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {extensionsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        Loading extensions...
                      </td>
                    </tr>
                  ) : extensions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        No extensions found
                      </td>
                    </tr>
                  ) : (
                    extensions.map((ext, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">{ext.extension}</td>
                        <td className="p-3">{ext.display_name}</td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(ext.status)}
                            <Badge variant={getStatusColor(ext.status)}>
                              {getStatusLabel(ext.status)}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {ext.lastSeen ? new Date(ext.lastSeen).toLocaleTimeString() : 'Never'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-600 max-w-xs truncate" title={ext.contact || 'N/A'}>
                            {ext.contact || 'N/A'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View Details"
                              onClick={() => console.log('View extension:', ext)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  const handleCreateTrunk = () => {
    setModalType('create');
    setFormData({});
    setEditingItem(null);
    setShowModal(true);
  };


  const handleViewTrunk = (trunk: any) => {
    setModalType('view');
    setFormData(trunk);
    setEditingItem(trunk);
    setShowModal(true);
  };


  const handleSaveTrunk = async () => {
    setLoading(true);
    try {
      // Prepare the data according to the API schema
      const trunkData = {
        name: formData.name,
        provider: formData.provider,
        status: modalType === 'create' ? 'testing' : formData.status || 'active',
        sip_config: {
          host: formData.sip_config?.host || formData.proxy,
          port: formData.sip_config?.port || formData.port || 5060,
          transport: formData.sip_config?.transport || formData.transport || 'udp',
          username: formData.sip_config?.username || formData.auth_username,
          password: formData.sip_config?.password || formData.auth_password,
          realm: formData.sip_config?.realm || formData.realm,
          register: true,
          retry_seconds: 60,
          caller_id_in_from: false,
          ping: true,
          ping_time: 60
        },
        did_config: {
          number: formData.did_config?.number || formData.number,
          country_code: formData.did_config?.country_code || formData.country_code,
          local_number: formData.did_config?.local_number || formData.local_number,
          area_code: formData.did_config?.area_code,
          provider_did: formData.did_config?.provider_did,
          inbound_route: formData.did_config?.inbound_route
        },
        security: {
          encryption: formData.security?.encryption || formData.encryption || 'tls',
          authentication: formData.security?.authentication || formData.authentication || 'digest',
          acl: [],
          rate_limit: {
            enabled: true,
            calls_per_minute: 60,
            calls_per_hour: 1000
          }
        },
        gdpr: {
          data_retention_days: formData.gdpr?.data_retention_days || formData.data_retention_days || 365,
          recording_consent_required: formData.gdpr?.recording_consent_required || formData.recording_consent_required || true,
          data_processing_purpose: 'Business communications',
          lawful_basis: 'legitimate_interest',
          data_controller: formData.gdpr?.data_controller || formData.data_controller,
          dpo_contact: formData.gdpr?.dpo_contact || formData.dpo_contact
        }
      };

      if (modalType === 'create') {
        // Create new trunk via API
        const response = await apiClient.post('/sip-trunks', trunkData);
        if ((response.data as any)?.success) {
          setTrunks(prev => [(response.data as any).data, ...prev]);
          alert('SIP Trunk created successfully!');
        }
      } else if (modalType === 'edit') {
        // Update existing trunk via API
        const response = await apiClient.put(`/sip-trunks/${editingItem.id}`, trunkData);
        if ((response.data as any)?.success) {
          setTrunks(prev => prev.map(trunk => 
            trunk.id === editingItem.id 
              ? (response.data as any).data
              : trunk
          ));
          alert('SIP Trunk updated successfully!');
        }
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error saving trunk:', error);
      alert('Error saving SIP trunk. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const renderSipTrunksView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">SIP Trunks Management</h3>
        <div className="flex items-center space-x-2">
          <Button onClick={loadTrunks} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateTrunk}>
            <Plus className="h-4 w-4 mr-2" />
            Create New SIP Trunk
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search trunks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-700">Name</th>
                  <th className="text-left p-3 font-medium text-gray-700">Provider</th>
                  <th className="text-left p-3 font-medium text-gray-700">Host</th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trunks.map((trunk, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">{trunk.name}</td>
                    <td className="p-3">{trunk.provider}</td>
                    <td className="p-3">{trunk.sip_config?.host}:{trunk.sip_config?.port}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(trunk.status || 'UNKNOWN')}
                        <Badge variant={getStatusColor(trunk.status || 'UNKNOWN')}>
                          {getStatusLabel(trunk.status || 'UNKNOWN')}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View Details"
                          onClick={() => handleViewTrunk(trunk)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
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
  );


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SIP Management</h1>
          <p className="text-gray-600">Monitor SIP status and manage SIP trunk configurations</p>
        </div>
        <Button onClick={loadTrunks} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderSipStatusCard()}
        {renderSipTrunksCard()}
      </div>

      {/* Embedded Content Below Cards */}
      <div className="mt-6">
        {activeView === 'status' ? renderSipStatusView() : renderSipTrunksView()}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {modalType === 'create' ? 'Create New' : modalType === 'edit' ? 'Edit' : 'View'} SIP Trunk
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Trunk Name *</label>
                    <Input 
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={modalType === 'view'}
                      placeholder="Messagenet SIP Trunk"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Provider *</label>
                    <Input 
                      value={formData.provider || ''}
                      onChange={(e) => setFormData({...formData, provider: e.target.value})}
                      disabled={modalType === 'view'}
                      placeholder="Messagenet"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SIP Configuration */}
              <div>
                <h3 className="text-lg font-medium mb-4">SIP Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Host/Proxy *</label>
                    <Input 
                      value={formData.sip_config?.host || formData.proxy || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        sip_config: {...formData.sip_config, host: e.target.value},
                        proxy: e.target.value
                      })}
                      disabled={modalType === 'view'}
                      placeholder="sip.messagenet.it"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Port *</label>
                    <Input 
                      type="number"
                      value={formData.sip_config?.port || formData.port || 5060}
                      onChange={(e) => setFormData({
                        ...formData, 
                        sip_config: {...formData.sip_config, port: parseInt(e.target.value)},
                        port: parseInt(e.target.value)
                      })}
                      disabled={modalType === 'view'}
                      placeholder="5060"
                      min="1"
                      max="65535"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Transport *</label>
                    <Select 
                      value={formData.sip_config?.transport || formData.transport || 'udp'}
                      onValueChange={(value) => setFormData({
                        ...formData, 
                        sip_config: {...formData.sip_config, transport: value},
                        transport: value
                      })}
                      disabled={modalType === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="udp">UDP</SelectItem>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Username *</label>
                    <Input 
                      value={formData.sip_config?.username || formData.auth_username || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        sip_config: {...formData.sip_config, username: e.target.value},
                        auth_username: e.target.value
                      })}
                      disabled={modalType === 'view'}
                      placeholder="messagenet_user"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Password *</label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        value={formData.sip_config?.password || formData.auth_password || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          sip_config: {...formData.sip_config, password: e.target.value},
                          auth_password: e.target.value
                        })}
                        disabled={modalType === 'view'}
                        placeholder="messagenet_password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={modalType === 'view'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Realm</label>
                    <Input 
                      value={formData.sip_config?.realm || formData.realm || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        sip_config: {...formData.sip_config, realm: e.target.value},
                        realm: e.target.value
                      })}
                      disabled={modalType === 'view'}
                      placeholder="messagenet.it"
                    />
                  </div>
                </div>
              </div>

              {/* DID Configuration */}
              <div>
                <h3 className="text-lg font-medium mb-4">DID Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">DID Number *</label>
                    <Input 
                      value={formData.did_config?.number || formData.number || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        did_config: {...formData.did_config, number: e.target.value},
                        number: e.target.value
                      })}
                      disabled={modalType === 'view'}
                      placeholder="+393331234567"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Country Code *</label>
                    <Input 
                      value={formData.did_config?.country_code || formData.country_code || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        did_config: {...formData.did_config, country_code: e.target.value},
                        country_code: e.target.value
                      })}
                      disabled={modalType === 'view'}
                      placeholder="IT"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Local Number *</label>
                    <Input 
                      value={formData.did_config?.local_number || formData.local_number || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        did_config: {...formData.did_config, local_number: e.target.value},
                        local_number: e.target.value
                      })}
                      disabled={modalType === 'view'}
                      placeholder="1234567"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Area Code</label>
                    <Input 
                      value={formData.did_config?.area_code || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        did_config: {...formData.did_config, area_code: e.target.value}
                      })}
                      disabled={modalType === 'view'}
                      placeholder="333"
                    />
                  </div>
                </div>
              </div>

              {/* Security Configuration */}
              <div>
                <h3 className="text-lg font-medium mb-4">Security Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Encryption</label>
                    <Select 
                      value={formData.security?.encryption || formData.encryption || 'tls'}
                      onValueChange={(value) => setFormData({
                        ...formData, 
                        security: {...formData.security, encryption: value},
                        encryption: value
                      })}
                      disabled={modalType === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="srtp">SRTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Authentication</label>
                    <Select 
                      value={formData.security?.authentication || formData.authentication || 'digest'}
                      onValueChange={(value) => setFormData({
                        ...formData, 
                        security: {...formData.security, authentication: value},
                        authentication: value
                      })}
                      disabled={modalType === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="digest">Digest</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* GDPR Configuration */}
              <div>
                <h3 className="text-lg font-medium mb-4">GDPR Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Data Retention (days)</label>
                    <Input 
                      type="number"
                      value={formData.gdpr?.data_retention_days || formData.data_retention_days || 365}
                      onChange={(e) => setFormData({
                        ...formData, 
                        gdpr: {...formData.gdpr, data_retention_days: parseInt(e.target.value)},
                        data_retention_days: parseInt(e.target.value)
                      })}
                      disabled={modalType === 'view'}
                      min="30"
                      max="2555"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data Controller *</label>
                    <Input 
                      value={formData.gdpr?.data_controller || formData.data_controller || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        gdpr: {...formData.gdpr, data_controller: e.target.value},
                        data_controller: e.target.value
                      })}
                      disabled={modalType === 'view'}
                      placeholder="Company Name SRL"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">DPO Contact</label>
                    <Input 
                      type="email"
                      value={formData.gdpr?.dpo_contact || formData.dpo_contact || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        gdpr: {...formData.gdpr, dpo_contact: e.target.value},
                        dpo_contact: e.target.value
                      })}
                      disabled={modalType === 'view'}
                      placeholder="dpo@company.com"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={formData.gdpr?.recording_consent_required || formData.recording_consent_required || true}
                      onCheckedChange={(checked) => setFormData({
                        ...formData, 
                        gdpr: {...formData.gdpr, recording_consent_required: checked},
                        recording_consent_required: checked
                      })}
                      disabled={modalType === 'view'}
                    />
                    <span className="text-sm font-medium">Recording Consent Required</span>
                  </div>
                </div>
              </div>
              
              {formData.last_error && (
                <div>
                  <label className="text-sm font-medium">Last Error</label>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{formData.last_error}</p>
                  </div>
                </div>
              )}
            </div>
            
            {modalType !== 'view' && (
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveTrunk} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Trunk'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
