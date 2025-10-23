import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Save,
  X,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { SipExtensionConfig } from '@voip/shared';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function Extensions() {
  const { user } = useAuth();
  const [extensions, setExtensions] = useState<SipExtensionConfig[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<SipExtensionConfig>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Load extensions on component mount
  useEffect(() => {
    loadExtensions();
  }, []);


  const loadExtensions = async () => {
    setLoading(true);
    try {
      // Load extensions from API using apiClient
      const data = await apiClient.getExtensions({ limit: 100 });
      
      console.log('📡 Extensions API Response:', data);
      
      if (data?.success && data?.data?.items && Array.isArray(data.data.items)) {
        // Map backend extensions to frontend format
        const mappedExtensions = data.data.items.map((ext: any) => ({
          id: ext.id,
          extension: ext.extension,
          display_name: ext.display_name,
          password: ext.password || '[HIDDEN]',
          status: ext.status,
          tenant_id: ext.tenant_id,
          created_at: ext.created_at,
          updated_at: ext.updated_at,
          sip_settings: {
            type: ext.type || 'user',
            host: 'dynamic',
            context: 'default'
          }
        }));
        setExtensions(mappedExtensions);
        console.log('✅ Extensions loaded from database:', mappedExtensions.length);
      } else {
        console.warn('⚠️ Invalid API response format, using empty array');
        setExtensions([]);
      }
    } catch (error) {
      console.error('❌ Error loading extensions:', error);
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await apiClient.post('/voip/sip-extensions', {
        ...formData,
        tenant_id: user.tenant_id
      });
      
      setExtensions(prev => [...prev, response.data]);
      setShowModal(false);
      setFormData({});
    } catch (error) {
      console.error('Error creating extension:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (extensionId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/voip/sip-extensions/${extensionId}`, formData);
      
      setExtensions(prev => prev.map(ext => ext.id === extensionId ? response.data : ext));
      setShowModal(false);
      setFormData({});
    } catch (error) {
      console.error('Error updating extension:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (extensionId: string) => {
    if (!confirm('Are you sure you want to delete this extension?')) return;
    
    setLoading(true);
    try {
      await apiClient.delete(`/voip/sip-extensions/${extensionId}`);
      
      setExtensions(prev => prev.filter(ext => ext.id !== extensionId));
    } catch (error) {
      console.error('Error deleting extension:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: 'create' | 'edit' | 'view', item?: any) => {
    setModalType(type);
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({});
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'locked': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'locked': return 'Locked';
      default: return 'Unknown';
    }
  };

  const filteredExtensions = extensions.filter(ext =>
    ext.extension.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ext.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Extension', key: 'extension' },
    { header: 'Display Name', key: 'display_name' },
    { header: 'Type', key: 'type', render: (item: any) => item.sip_settings?.type || 'user' },
    { header: 'Host', key: 'host', render: (item: any) => item.sip_settings?.host || 'localhost' },
    { 
      header: 'Status', 
      key: 'status',
      render: (item: any) => (
        <Badge variant={getStatusColor(item.status)}>
          {getStatusLabel(item.status)}
        </Badge>
      )
    },
    { header: 'Context', key: 'context', render: (item: any) => item.sip_settings?.context || 'default' }
  ];

  const renderDataTable = () => (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              {columns.map((col, index) => (
                <th key={index} className="text-left p-3 font-medium text-gray-700">
                  {col.header}
                </th>
              ))}
              <th className="text-right p-3 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExtensions.map((extension, index) => (
              <tr key={extension.id || index} className="border-b hover:bg-gray-50">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="p-3">
                    {col.render ? col.render(extension) : extension[col.key]}
                  </td>
                ))}
                <td className="p-3">
                  <div className="flex items-center justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal('view', extension)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal('edit', extension)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(extension.id)}
                      title="Delete"
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
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {modalType === 'create' ? 'Create New' : modalType === 'edit' ? 'Edit' : 'View'} Extension
            </h2>
            <Button variant="ghost" size="sm" onClick={closeModal}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="sip">SIP</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Extension Number</label>
                  <Input 
                    placeholder="1001" 
                    value={formData.extension || ''}
                    onChange={(e) => setFormData({...formData, extension: e.target.value})}
                    disabled={modalType === 'view'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Display Name</label>
                  <Input 
                    placeholder="John Doe" 
                    value={formData.display_name || ''}
                    onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                    disabled={modalType === 'view'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password" 
                      value={formData.password || ''}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      disabled={modalType === 'view'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={modalType === 'view'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={formData.status || 'active'}
                    onValueChange={(value) => setFormData({...formData, status: value as any})}
                    disabled={modalType === 'view'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="locked">Locked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sip" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">SIP Type</label>
                  <Select 
                    value={formData.sip_settings?.type || 'user'}
                    onValueChange={(value) => setFormData({
                      ...formData, 
                      sip_settings: {...formData.sip_settings, type: value as any}
                    })}
                    disabled={modalType === 'view'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SIP type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="peer">Peer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Host</label>
                  <Input 
                    placeholder="dynamic" 
                    value={formData.sip_settings?.host || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      sip_settings: {...formData.sip_settings, host: e.target.value}
                    })}
                    disabled={modalType === 'view'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Context</label>
                  <Input 
                    placeholder="default" 
                    value={formData.sip_settings?.context || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      sip_settings: {...formData.sip_settings, context: e.target.value}
                    })}
                    disabled={modalType === 'view'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">NAT Mode</label>
                  <Select 
                    value={formData.sip_settings?.nat || 'force_rport'}
                    onValueChange={(value) => setFormData({
                      ...formData, 
                      sip_settings: {...formData.sip_settings, nat: value as any}
                    })}
                    disabled={modalType === 'view'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select NAT mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="force_rport">Force RPort</SelectItem>
                      <SelectItem value="comedia">Comedia</SelectItem>
                      <SelectItem value="auto_force_rport">Auto Force RPort</SelectItem>
                      <SelectItem value="auto_comedia">Auto Comedia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="qualify" 
                    checked={formData.sip_settings?.qualify || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData, 
                      sip_settings: {...formData.sip_settings, qualify: checked}
                    })}
                    disabled={modalType === 'view'}
                  />
                  <label htmlFor="qualify" className="text-sm font-medium">Qualify</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="canreinvite" 
                    checked={formData.sip_settings?.canreinvite || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData, 
                      sip_settings: {...formData.sip_settings, canreinvite: checked}
                    })}
                    disabled={modalType === 'view'}
                  />
                  <label htmlFor="canreinvite" className="text-sm font-medium">Can Reinvite</label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="call-forwarding" 
                    checked={formData.call_features?.call_forwarding?.enabled || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData, 
                      call_features: {
                        ...formData.call_features,
                        call_forwarding: {...formData.call_features?.call_forwarding, enabled: checked}
                      }
                    })}
                    disabled={modalType === 'view'}
                  />
                  <label htmlFor="call-forwarding" className="text-sm font-medium">Call Forwarding</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="call-waiting" 
                    checked={formData.call_features?.call_waiting || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData, 
                      call_features: {...formData.call_features, call_waiting: checked}
                    })}
                    disabled={modalType === 'view'}
                  />
                  <label htmlFor="call-waiting" className="text-sm font-medium">Call Waiting</label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="three-way-calling" 
                    checked={formData.call_features?.three_way_calling || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData, 
                      call_features: {...formData.call_features, three_way_calling: checked}
                    })}
                    disabled={modalType === 'view'}
                  />
                  <label htmlFor="three-way-calling" className="text-sm font-medium">Three Way Calling</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="voicemail" 
                    checked={formData.call_features?.voicemail?.enabled || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData, 
                      call_features: {
                        ...formData.call_features,
                        voicemail: {...formData.call_features?.voicemail, enabled: checked}
                      }
                    })}
                    disabled={modalType === 'view'}
                  />
                  <label htmlFor="voicemail" className="text-sm font-medium">Voicemail</label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="call-recording" 
                    checked={formData.call_features?.call_recording || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData, 
                      call_features: {...formData.call_features, call_recording: checked}
                    })}
                    disabled={modalType === 'view'}
                  />
                  <label htmlFor="call-recording" className="text-sm font-medium">Call Recording</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="dnd" 
                    checked={formData.call_features?.do_not_disturb || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData, 
                      call_features: {...formData.call_features, do_not_disturb: checked}
                    })}
                    disabled={modalType === 'view'}
                  />
                  <label htmlFor="dnd" className="text-sm font-medium">Do Not Disturb</label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="encryption" 
                    checked={formData.security?.encryption || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData, 
                      security: {...formData.security, encryption: checked}
                    })}
                    disabled={modalType === 'view'}
                  />
                  <label htmlFor="encryption" className="text-sm font-medium">Encryption</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="anonymous-calls" 
                    checked={formData.security?.allow_anonymous_calls || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData, 
                      security: {...formData.security, allow_anonymous_calls: checked}
                    })}
                    disabled={modalType === 'view'}
                  />
                  <label htmlFor="anonymous-calls" className="text-sm font-medium">Allow Anonymous Calls</label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Calls</label>
                  <Input 
                    type="number"
                    placeholder="1" 
                    value={formData.security?.max_calls || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      security: {...formData.security, max_calls: parseInt(e.target.value)}
                    })}
                    disabled={modalType === 'view'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Call Timeout</label>
                  <Input 
                    type="number"
                    placeholder="60" 
                    value={formData.security?.call_timeout || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      security: {...formData.security, call_timeout: parseInt(e.target.value)}
                    })}
                    disabled={modalType === 'view'}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {modalType !== 'view' && (
            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                variant="outline"
                onClick={closeModal}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (editingItem) {
                    handleUpdate(editingItem.id);
                  } else {
                    handleCreate();
                  }
                }}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SIP Extensions</h1>
          <p className="text-muted-foreground">
            Manage SIP extensions, configure call features, and monitor registration status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search extensions..."
              className="pl-8 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={loadExtensions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => openModal('create')} 
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Extension
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Extensions ({filteredExtensions.length})
          </CardTitle>
          <CardDescription>
            Manage and configure SIP extensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderDataTable()}
        </CardContent>
      </Card>

      {/* Modal */}
      {renderModal()}
    </div>
  );
}