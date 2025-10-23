import { useState, useEffect } from 'react';
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
  ArrowRight, 
  ArrowLeft,
  Save,
  X,
  RefreshCw,
  Eye,
  Mic
} from 'lucide-react';
import { 
  InboundRoute, 
  OutboundRoute 
} from '@voip/shared';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useVoipEntityOptions } from '@/hooks/use-voip-entities';

export default function CallRouting() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inbound');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [inboundRoutes, setInboundRoutes] = useState<InboundRoute[]>([]);
  const [outboundRoutes, setOutboundRoutes] = useState<OutboundRoute[]>([]);

  // Form states
  const [formData, setFormData] = useState<any>({});
  const [editingItem, setEditingItem] = useState<any>(null);

  // VoIP Entity Options for dropdowns
  const { options: extensionOptions } = useVoipEntityOptions('extensions');
  const { options: ringGroupOptions } = useVoipEntityOptions('ring-groups');
  const { options: queueOptions } = useVoipEntityOptions('queues');
  const { options: conferenceOptions } = useVoipEntityOptions('conference-rooms');
  const { options: voicemailOptions } = useVoipEntityOptions('voicemail-boxes');
  const { options: ivrOptions } = useVoipEntityOptions('ivr-menus');
  const { options: timeConditionOptions } = useVoipEntityOptions('time-conditions');
  const { options: trunkOptions } = useVoipEntityOptions('extensions');

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    try {
      const [inboundRes, outboundRes] = await Promise.all([
        apiClient.get(`/voip/inbound-routes?tenant_id=${user.tenant_id}`),
        apiClient.get(`/voip/outbound-routes?tenant_id=${user.tenant_id}`)
      ]);

      setInboundRoutes((inboundRes.data as InboundRoute[]) || []);
      setOutboundRoutes((outboundRes.data as OutboundRoute[]) || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (type: string, data: any) => {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await apiClient.post(`/voip/${type}`, {
        ...data,
        tenant_id: user.tenant_id
      });
      
      // Update local state
      if (type === 'inbound-routes') {
        setInboundRoutes(prev => [...prev, response.data]);
      } else {
        setOutboundRoutes(prev => [...prev, response.data]);
      }
      
      setShowModal(false);
      setFormData({});
    } catch (error) {
      console.error('Error creating route:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (type: string, id: string, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/voip/${type}/${id}`, data);
      
      // Update local state
      if (type === 'inbound-routes') {
        setInboundRoutes(prev => prev.map(item => item.id === id ? response.data : item));
      } else {
        setOutboundRoutes(prev => prev.map(item => item.id === id ? response.data : item));
      }
      
      setShowModal(false);
      setFormData({});
    } catch (error) {
      console.error('Error updating route:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    
    setLoading(true);
    try {
      await apiClient.delete(`/voip/${type}/${id}`);
      
      // Update local state
      if (type === 'inbound-routes') {
        setInboundRoutes(prev => prev.filter(item => item.id !== id));
      } else {
        setOutboundRoutes(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Error deleting route:', error);
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

  const getDestinationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      extension: 'Extension',
      ring_group: 'Ring Group',
      queue: 'Queue',
      voicemail: 'Voicemail',
      ivr: 'IVR Menu',
      conference: 'Conference',
      external: 'External Number',
    };
    return labels[type] || type;
  };

  const renderDataTable = (data: any[], type: string, columns: any[]) => (
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
            {data.map((item, index) => (
              <tr key={item.id || index} className="border-b hover:bg-gray-50">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="p-3">
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
                <td className="p-3">
                  <div className="flex items-center justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal('view', item)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal('edit', item)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(type, item.id)}
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

  const renderInboundRoutes = () => {
    const columns = [
      { header: 'Name', key: 'name' },
      { header: 'DID Number', key: 'did_number' },
      { 
        header: 'Destination', 
        key: 'destination',
        render: (item: any) => `${getDestinationTypeLabel(item.destination_type)}: ${item.destination_value}`
      },
      { 
        header: 'Status', 
        key: 'status',
        render: (item: any) => (
          <div className="flex items-center space-x-2">
            <Badge variant={item.enabled ? 'default' : 'secondary'}>
              {item.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            {item.record_calls && (
              <Badge variant="outline" className="text-red-600">
                <Mic className="h-3 w-3 mr-1" />
                Recording
              </Badge>
            )}
          </div>
        )
      },
      { header: 'Description', key: 'description' }
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <ArrowRight className="h-5 w-5 mr-2" />
            Inbound Routes ({inboundRoutes.length})
          </h3>
          <div className="flex items-center space-x-2">
            <Button onClick={loadAllData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => openModal('create')} 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Inbound Route
            </Button>
          </div>
        </div>
        {renderDataTable(inboundRoutes, 'inbound-routes', columns)}
      </div>
    );
  };

  const renderOutboundRoutes = () => {
    const columns = [
      { header: 'Name', key: 'name' },
      { header: 'Dial Pattern', key: 'dial_pattern' },
      { header: 'Trunk', key: 'trunk_id' },
      { 
        header: 'Status', 
        key: 'status',
        render: (item: any) => (
          <div className="flex items-center space-x-2">
            <Badge variant={item.enabled ? 'default' : 'secondary'}>
              {item.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            {item.record_calls && (
              <Badge variant="outline" className="text-red-600">
                <Mic className="h-3 w-3 mr-1" />
                Recording
              </Badge>
            )}
          </div>
        )
      },
      { header: 'Description', key: 'description' }
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Outbound Routes ({outboundRoutes.length})
          </h3>
          <div className="flex items-center space-x-2">
            <Button onClick={loadAllData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => openModal('create')} 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Outbound Route
            </Button>
          </div>
        </div>
        {renderDataTable(outboundRoutes, 'outbound-routes', columns)}
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {modalType === 'create' ? 'Create New' : modalType === 'edit' ? 'Edit' : 'View'} {activeTab} Route
            </h2>
            <Button variant="ghost" size="sm" onClick={closeModal}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="routing">Routing</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="recording">Recording</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Route Name</label>
                  <Input 
                    placeholder="Route name" 
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={modalType === 'view'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input 
                    placeholder="Route description" 
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    disabled={modalType === 'view'}
                  />
                </div>
              </div>
              {activeTab === 'inbound' && (
                <div>
                  <label className="text-sm font-medium">DID Number</label>
                  <Input 
                    placeholder="+1234567890" 
                    value={formData.did_number || ''}
                    onChange={(e) => setFormData({...formData, did_number: e.target.value})}
                    disabled={modalType === 'view'}
                  />
                </div>
              )}
              {activeTab === 'outbound' && (
                <div>
                  <label className="text-sm font-medium">Dial Pattern</label>
                  <Input 
                    placeholder="^\+1([0-9]{10})$" 
                    value={formData.dial_pattern || ''}
                    onChange={(e) => setFormData({...formData, dial_pattern: e.target.value})}
                    disabled={modalType === 'view'}
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch 
                  id="enabled" 
                  checked={formData.enabled || false}
                  onCheckedChange={(checked) => setFormData({...formData, enabled: checked})}
                  disabled={modalType === 'view'}
                />
                <label htmlFor="enabled" className="text-sm font-medium">Enabled</label>
              </div>
            </TabsContent>
            
            <TabsContent value="routing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Destination Type</label>
                  <Select 
                    value={formData.destination_type || ''}
                    onValueChange={(value) => setFormData({...formData, destination_type: value})}
                    disabled={modalType === 'view'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="extension">Extension</SelectItem>
                      <SelectItem value="ring_group">Ring Group</SelectItem>
                      <SelectItem value="queue">Queue</SelectItem>
                      <SelectItem value="voicemail">Voicemail</SelectItem>
                      <SelectItem value="ivr">IVR Menu</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="external">External Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Destination Value</label>
                  {formData.destination_type === 'extension' && (
                    <Select 
                      value={formData.destination_value || ''}
                      onValueChange={(value) => setFormData({...formData, destination_value: value})}
                      disabled={modalType === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select extension" />
                      </SelectTrigger>
                      <SelectContent>
                        {extensionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {formData.destination_type === 'ring_group' && (
                    <Select 
                      value={formData.destination_value || ''}
                      onValueChange={(value) => setFormData({...formData, destination_value: value})}
                      disabled={modalType === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ring group" />
                      </SelectTrigger>
                      <SelectContent>
                        {ringGroupOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {formData.destination_type === 'queue' && (
                    <Select 
                      value={formData.destination_value || ''}
                      onValueChange={(value) => setFormData({...formData, destination_value: value})}
                      disabled={modalType === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select queue" />
                      </SelectTrigger>
                      <SelectContent>
                        {queueOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {formData.destination_type === 'conference' && (
                    <Select 
                      value={formData.destination_value || ''}
                      onValueChange={(value) => setFormData({...formData, destination_value: value})}
                      disabled={modalType === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select conference room" />
                      </SelectTrigger>
                      <SelectContent>
                        {conferenceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {formData.destination_type === 'voicemail' && (
                    <Select 
                      value={formData.destination_value || ''}
                      onValueChange={(value) => setFormData({...formData, destination_value: value})}
                      disabled={modalType === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select voicemail box" />
                      </SelectTrigger>
                      <SelectContent>
                        {voicemailOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {formData.destination_type === 'ivr' && (
                    <Select 
                      value={formData.destination_value || ''}
                      onValueChange={(value) => setFormData({...formData, destination_value: value})}
                      disabled={modalType === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select IVR menu" />
                      </SelectTrigger>
                      <SelectContent>
                        {ivrOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {(formData.destination_type === 'external' || !formData.destination_type) && (
                    <Input 
                      placeholder="External number or ID"
                      value={formData.destination_value || ''}
                      onChange={(e) => setFormData({...formData, destination_value: e.target.value})}
                      disabled={modalType === 'view'}
                    />
                  )}
                </div>
              </div>
              
              {/* Time Condition */}
              <div>
                <label className="text-sm font-medium">Time Condition (Optional)</label>
                <Select 
                  value={formData.time_condition_id || ''}
                  onValueChange={(value) => setFormData({...formData, time_condition_id: value})}
                  disabled={modalType === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No time condition</SelectItem>
                    {timeConditionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {activeTab === 'outbound' && (
                <div>
                  <label className="text-sm font-medium">SIP Trunk</label>
                  <Select 
                    value={formData.trunk_id || ''}
                    onValueChange={(value) => setFormData({...formData, trunk_id: value})}
                    disabled={modalType === 'view'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SIP trunk" />
                    </SelectTrigger>
                    <SelectContent>
                      {trunkOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Input 
                    type="number"
                    placeholder="100" 
                    value={formData.priority || ''}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    disabled={modalType === 'view'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Timeout (seconds)</label>
                  <Input 
                    type="number"
                    placeholder="30" 
                    value={formData.timeout || ''}
                    onChange={(e) => setFormData({...formData, timeout: parseInt(e.target.value)})}
                    disabled={modalType === 'view'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="caller-id-override" 
                    checked={formData.caller_id_override || false}
                    onCheckedChange={(checked) => setFormData({...formData, caller_id_override: checked})}
                    disabled={modalType === 'view'}
                  />
                  <label htmlFor="caller-id-override" className="text-sm font-medium">Caller ID Override</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="failover-enabled" 
                    checked={formData.failover_enabled || false}
                    onCheckedChange={(checked) => setFormData({...formData, failover_enabled: checked})}
                    disabled={modalType === 'view'}
                  />
                  <label htmlFor="failover-enabled" className="text-sm font-medium">Failover Enabled</label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="recording" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="record-calls" 
                  checked={formData.record_calls || false}
                  onCheckedChange={(checked) => setFormData({...formData, record_calls: checked})}
                  disabled={modalType === 'view'}
                />
                <label htmlFor="record-calls" className="text-sm font-medium">Record Calls</label>
              </div>
              <div>
                <label className="text-sm font-medium">Recording Path</label>
                <Input 
                  placeholder="/var/recordings/" 
                  value={formData.recording_path || ''}
                  onChange={(e) => setFormData({...formData, recording_path: e.target.value})}
                  disabled={modalType === 'view'}
                />
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
                    handleUpdate(`${activeTab}-routes`, editingItem.id, formData);
                  } else {
                    handleCreate(`${activeTab}-routes`, formData);
                  }
                }}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Route'}
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
          <h1 className="text-3xl font-bold tracking-tight">Call Routing</h1>
          <p className="text-muted-foreground">
            Configure inbound and outbound call routing rules
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search routes..."
              className="pl-8 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbound">Inbound Routes</TabsTrigger>
            <TabsTrigger value="outbound">Outbound Routes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inbound" className="mt-6">
            {renderInboundRoutes()}
          </TabsContent>
          
          <TabsContent value="outbound" className="mt-6">
            {renderOutboundRoutes()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  );
}