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
  Users, 
  MessageSquare, 
  Video, 
  Clock, 
  Headphones,
  Save,
  X,
  RefreshCw,
  Eye
} from 'lucide-react';
import { 
  RingGroup, 
  Queue, 
  ConferenceRoom, 
  VoicemailBox, 
  TimeCondition, 
  IvrMenu 
} from '@voip/shared';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function Destinations() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ring-groups');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [ringGroups, setRingGroups] = useState<RingGroup[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [conferenceRooms, setConferenceRooms] = useState<ConferenceRoom[]>([]);
  const [voicemailBoxes, setVoicemailBoxes] = useState<VoicemailBox[]>([]);
  const [timeConditions, setTimeConditions] = useState<TimeCondition[]>([]);
  const [ivrMenus, setIvrMenus] = useState<IvrMenu[]>([]);

  // Form states
  const [formData, setFormData] = useState<any>({});
  const [editingItem, setEditingItem] = useState<any>(null);

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    try {
      const [ringRes, queueRes, confRes, vmRes, timeRes, ivrRes] = await Promise.all([
        apiClient.getRingGroups(),
        apiClient.getQueues(),
        apiClient.getConferenceRooms(),
        apiClient.getVoicemailBoxes(),
        apiClient.getTimeConditions(),
        apiClient.getIvrMenus()
      ]);

      setRingGroups((ringRes.data as RingGroup[]) || []);
      setQueues((queueRes.data as Queue[]) || []);
      setConferenceRooms((confRes.data as ConferenceRoom[]) || []);
      setVoicemailBoxes((vmRes.data as VoicemailBox[]) || []);
      setTimeConditions((timeRes.data as TimeCondition[]) || []);
      setIvrMenus((ivrRes.data as IvrMenu[]) || []);
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
      switch (type) {
        case 'ring-groups':
          setRingGroups(prev => [...prev, response.data]);
          break;
        case 'queues':
          setQueues(prev => [...prev, response.data]);
          break;
        case 'conference-rooms':
          setConferenceRooms(prev => [...prev, response.data]);
          break;
        case 'voicemail-boxes':
          setVoicemailBoxes(prev => [...prev, response.data]);
          break;
        case 'time-conditions':
          setTimeConditions(prev => [...prev, response.data]);
          break;
        case 'ivr-menus':
          setIvrMenus(prev => [...prev, response.data]);
          break;
      }
      
      setShowModal(false);
      setFormData({});
    } catch (error) {
      console.error('Error creating item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (type: string, id: string, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/voip/${type}/${id}`, data);
      
      // Update local state
      switch (type) {
        case 'ring-groups':
          setRingGroups(prev => prev.map(item => item.id === id ? response.data : item));
          break;
        case 'queues':
          setQueues(prev => prev.map(item => item.id === id ? response.data : item));
          break;
        case 'conference-rooms':
          setConferenceRooms(prev => prev.map(item => item.id === id ? response.data : item));
          break;
        case 'voicemail-boxes':
          setVoicemailBoxes(prev => prev.map(item => item.id === id ? response.data : item));
          break;
        case 'time-conditions':
          setTimeConditions(prev => prev.map(item => item.id === id ? response.data : item));
          break;
        case 'ivr-menus':
          setIvrMenus(prev => prev.map(item => item.id === id ? response.data : item));
          break;
      }
      
      setShowModal(false);
      setFormData({});
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    setLoading(true);
    try {
      await apiClient.delete(`/voip/${type}/${id}`);
      
      // Update local state
      switch (type) {
        case 'ring-groups':
          setRingGroups(prev => prev.filter(item => item.id !== id));
          break;
        case 'queues':
          setQueues(prev => prev.filter(item => item.id !== id));
          break;
        case 'conference-rooms':
          setConferenceRooms(prev => prev.filter(item => item.id !== id));
          break;
        case 'voicemail-boxes':
          setVoicemailBoxes(prev => prev.filter(item => item.id !== id));
          break;
        case 'time-conditions':
          setTimeConditions(prev => prev.filter(item => item.id !== id));
          break;
        case 'ivr-menus':
          setIvrMenus(prev => prev.filter(item => item.id !== id));
          break;
      }
      
      if (selectedItem === id) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
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

  const renderRingGroups = () => {
    const columns = [
      { header: 'Name', key: 'name' },
      { header: 'Extension', key: 'extension_number' },
      { header: 'Strategy', key: 'strategy' },
      { header: 'Members', key: 'members', render: (item: any) => `${item.members?.length || 0} members` },
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
      }
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Ring Groups ({ringGroups.length})
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
              Add Ring Group
            </Button>
          </div>
        </div>
        {renderDataTable(ringGroups, 'ring-groups', columns)}
      </div>
    );
  };

  const renderQueues = () => {
    const columns = [
      { header: 'Name', key: 'name' },
      { header: 'Extension', key: 'extension_number' },
      { header: 'Strategy', key: 'strategy' },
      { header: 'Agents', key: 'agents', render: (item: any) => `${item.agents?.length || 0} agents` },
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
      }
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Queues ({queues.length})
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
              Add Queue
            </Button>
          </div>
        </div>
        {renderDataTable(queues, 'queues', columns)}
      </div>
    );
  };

  const renderConferenceRooms = () => {
    const columns = [
      { header: 'Name', key: 'name' },
      { header: 'Extension', key: 'extension_number' },
      { header: 'Max Members', key: 'max_members' },
      { header: 'PIN', key: 'pin', render: (item: any) => item.pin ? '***' : 'None' },
      { 
        header: 'Status', 
        key: 'status',
        render: (item: any) => (
          <div className="flex items-center space-x-2">
            <Badge variant={item.enabled ? 'default' : 'secondary'}>
              {item.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            {item.record_conference && (
              <Badge variant="outline" className="text-red-600">
                <Mic className="h-3 w-3 mr-1" />
                Recording
              </Badge>
            )}
          </div>
        )
      }
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Conference Rooms ({conferenceRooms.length})
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
              Add Conference Room
            </Button>
          </div>
        </div>
        {renderDataTable(conferenceRooms, 'conference-rooms', columns)}
      </div>
    );
  };

  const renderVoicemailBoxes = () => {
    const columns = [
      { header: 'Display Name', key: 'display_name' },
      { header: 'Extension', key: 'extension_number' },
      { header: 'Email', key: 'email_address' },
      { header: 'Max Messages', key: 'max_messages' },
      { 
        header: 'Status', 
        key: 'status',
        render: (item: any) => (
          <div className="flex items-center space-x-2">
            <Badge variant={item.enabled ? 'default' : 'secondary'}>
              {item.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            {item.email_notification && (
              <Badge variant="outline" className="text-blue-600">
                <MessageSquare className="h-3 w-3 mr-1" />
                Email
              </Badge>
            )}
          </div>
        )
      }
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Voicemail Boxes ({voicemailBoxes.length})
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
              Add Voicemail Box
            </Button>
          </div>
        </div>
        {renderDataTable(voicemailBoxes, 'voicemail-boxes', columns)}
      </div>
    );
  };

  const renderTimeConditions = () => {
    const columns = [
      { header: 'Name', key: 'name' },
      { header: 'Timezone', key: 'timezone' },
      { header: 'Business Hours', key: 'business_hours', render: () => 'Mon-Fri 09:00-17:00' },
      { 
        header: 'Status', 
        key: 'status',
        render: (item: any) => (
          <Badge variant={item.enabled ? 'default' : 'secondary'}>
            {item.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        )
      },
      { header: 'Description', key: 'description' }
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Time Conditions ({timeConditions.length})
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
              Add Time Condition
            </Button>
          </div>
        </div>
        {renderDataTable(timeConditions, 'time-conditions', columns)}
      </div>
    );
  };

  const renderIvrMenus = () => {
    const columns = [
      { header: 'Name', key: 'name' },
      { header: 'Timeout', key: 'timeout_seconds', render: (item: any) => `${item.timeout_seconds}s` },
      { header: 'Options', key: 'options', render: (item: any) => `${item.options?.length || 0} options` },
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
            <Headphones className="h-5 w-5 mr-2" />
            IVR Menus ({ivrMenus.length})
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
              Add IVR Menu
            </Button>
          </div>
        </div>
        {renderDataTable(ivrMenus, 'ivr-menus', columns)}
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
              {modalType === 'create' ? 'Create New' : modalType === 'edit' ? 'Edit' : 'View'} {activeTab}
            </h2>
            <Button variant="ghost" size="sm" onClick={closeModal}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="recording">Recording</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input 
                    placeholder="Item name" 
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={modalType === 'view'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input 
                    placeholder="Item description" 
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    disabled={modalType === 'view'}
                  />
                </div>
              </div>
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
            
            <TabsContent value="configuration" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Extension Number</label>
                  <Input 
                    placeholder="1001" 
                    value={formData.extension_number || ''}
                    onChange={(e) => setFormData({...formData, extension_number: e.target.value})}
                    disabled={modalType === 'view'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Strategy</label>
                  <Select 
                    value={formData.strategy || ''}
                    onValueChange={(value) => setFormData({...formData, strategy: value})}
                    disabled={modalType === 'view'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simultaneous">Simultaneous</SelectItem>
                      <SelectItem value="sequential">Sequential</SelectItem>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
                      <SelectItem value="longest_idle">Longest Idle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="text-sm font-medium">Max Calls</label>
                  <Input 
                    type="number"
                    placeholder="10" 
                    value={formData.max_calls || ''}
                    onChange={(e) => setFormData({...formData, max_calls: parseInt(e.target.value)})}
                    disabled={modalType === 'view'}
                  />
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
                    handleUpdate(activeTab, editingItem.id, formData);
                  } else {
                    handleCreate(activeTab, formData);
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
          <h1 className="text-3xl font-bold tracking-tight">Destinations & Time</h1>
          <p className="text-muted-foreground">
            Create and manage destinations (Ring Groups, Queues, Conference Rooms, Voicemail Boxes) and time conditions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search destinations..."
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="ring-groups">Ring Groups</TabsTrigger>
            <TabsTrigger value="queues">Queues</TabsTrigger>
            <TabsTrigger value="conference-rooms">Conference</TabsTrigger>
            <TabsTrigger value="voicemail-boxes">Voicemail</TabsTrigger>
            <TabsTrigger value="time-conditions">Time Conditions</TabsTrigger>
            <TabsTrigger value="ivr-menus">IVR Menus</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ring-groups" className="mt-6">
            {renderRingGroups()}
          </TabsContent>
          
          <TabsContent value="queues" className="mt-6">
            {renderQueues()}
          </TabsContent>
          
          <TabsContent value="conference-rooms" className="mt-6">
            {renderConferenceRooms()}
          </TabsContent>
          
          <TabsContent value="voicemail-boxes" className="mt-6">
            {renderVoicemailBoxes()}
          </TabsContent>
          
          <TabsContent value="time-conditions" className="mt-6">
            {renderTimeConditions()}
          </TabsContent>
          
          <TabsContent value="ivr-menus" className="mt-6">
            {renderIvrMenus()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  );
}

