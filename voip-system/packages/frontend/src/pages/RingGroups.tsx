import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Users,
  Settings,
  Clock,
  MoreHorizontal,
  UserPlus,
  UserMinus,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RingGroup {
  id: string;
  name: string;
  description?: string;
  extension: string;
  strategy: 'ringall' | 'hunt' | 'random' | 'simultaneous';
  ring_time: number;
  members: Array<{
    extension_id: string;
    extension: string;
    display_name: string;
    priority: number;
    ring_delay: number;
    ring_timeout: number;
    enabled: boolean;
  }>;
  voicemail_enabled: boolean;
  voicemail_extension?: string;
  call_timeout: number;
  call_timeout_action: 'voicemail' | 'hangup' | 'forward';
  enabled: boolean;
  current_calls: number;
  max_concurrent_calls: number;
}

interface Extension {
  id: string;
  extension: string;
  display_name: string;
}

export default function RingGroups() {
  const { user } = useAuth();
  const [ringGroups, setRingGroups] = useState<RingGroup[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<RingGroup>>({});
  const [editingItem, setEditingItem] = useState<RingGroup | null>(null);

  // Load ring groups on component mount
  useEffect(() => {
    loadRingGroups();
    loadExtensions();
  }, []);

  const loadRingGroups = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://192.168.172.234:3000/api';
      const response = await fetch(`${API_BASE_URL}/ring-groups`);
      const data = await response.json();
      
      if (data?.success && Array.isArray(data?.data)) {
        setRingGroups(data.data);
      } else {
        console.warn('⚠️ Invalid API response format');
        setRingGroups([]);
      }
    } catch (error) {
      console.error('❌ Error loading ring groups:', error);
      setRingGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExtensions = async () => {
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://192.168.172.234:3000/api';
      const response = await fetch(`${API_BASE_URL}/extensions`);
      const data = await response.json();
      
      if (data?.success && Array.isArray(data?.extensions)) {
        setExtensions(data.extensions.map((ext: any) => ({
          id: ext.id,
          extension: ext.extension,
          display_name: ext.display_name
        })));
      }
    } catch (error) {
      console.error('❌ Error loading extensions:', error);
    }
  };

  const handleCreate = async () => {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://192.168.172.234:3000/api';
      const response = await fetch(`${API_BASE_URL}/ring-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tenant_id: user.tenant_id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadRingGroups();
        setShowModal(false);
        setFormData({});
      } else {
        console.error('❌ Error creating ring group:', data.message);
      }
    } catch (error) {
      console.error('❌ Error creating ring group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://192.168.172.234:3000/api';
      const response = await fetch(`${API_BASE_URL}/ring-groups/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadRingGroups();
        setShowModal(false);
        setFormData({});
        setEditingItem(null);
      } else {
        console.error('❌ Error updating ring group:', data.message);
      }
    } catch (error) {
      console.error('❌ Error updating ring group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ringGroup: RingGroup) => {
    if (!confirm(`Are you sure you want to delete ring group "${ringGroup.name}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://192.168.172.234:3000/api';
      const response = await fetch(`${API_BASE_URL}/ring-groups/${ringGroup.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadRingGroups();
      } else {
        console.error('❌ Error deleting ring group:', data.message);
      }
    } catch (error) {
      console.error('❌ Error deleting ring group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (ringGroupId: string, extensionId: string) => {
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://192.168.172.234:3000/api';
      const response = await fetch(`${API_BASE_URL}/ring-groups/${ringGroupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extension_id: extensionId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadRingGroups();
      } else {
        console.error('❌ Error adding member:', data.message);
      }
    } catch (error) {
      console.error('❌ Error adding member:', error);
    }
  };

  const handleRemoveMember = async (ringGroupId: string, extensionId: string) => {
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://192.168.172.234:3000/api';
      const response = await fetch(`${API_BASE_URL}/ring-groups/${ringGroupId}/members/${extensionId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadRingGroups();
      } else {
        console.error('❌ Error removing member:', data.message);
      }
    } catch (error) {
      console.error('❌ Error removing member:', error);
    }
  };

  const filteredRingGroups = ringGroups.filter(rg =>
    rg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rg.extension.includes(searchTerm) ||
    rg.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'ringall': return 'Ring All';
      case 'hunt': return 'Hunt';
      case 'random': return 'Random';
      case 'simultaneous': return 'Simultaneous';
      default: return strategy;
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'ringall': return 'bg-blue-100 text-blue-800';
      case 'hunt': return 'bg-green-100 text-green-800';
      case 'random': return 'bg-purple-100 text-purple-800';
      case 'simultaneous': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ring Groups</h1>
          <p className="text-gray-600">Manage ring groups for simultaneous or sequential ringing</p>
        </div>
        <Button onClick={() => {
          setModalType('create');
          setFormData({});
          setShowModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Ring Group
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search ring groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadRingGroups} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Ring Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRingGroups.map((ringGroup) => (
          <Card key={ringGroup.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{ringGroup.name}</CardTitle>
                  <CardDescription>{ringGroup.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={ringGroup.enabled ? 'default' : 'secondary'}>
                    {ringGroup.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Extension and Strategy */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{ringGroup.extension}</span>
                </div>
                <Badge className={getStrategyColor(ringGroup.strategy)}>
                  {getStrategyLabel(ringGroup.strategy)}
                </Badge>
              </div>

              {/* Members */}
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {ringGroup.members.length} member{ringGroup.members.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Ring Time */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {ringGroup.ring_time}s ring time
                </span>
              </div>

              {/* Current Calls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {ringGroup.current_calls}/{ringGroup.max_concurrent_calls} calls
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {ringGroup.current_calls > 0 ? (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModalType('edit');
                    setFormData(ringGroup);
                    setEditingItem(ringGroup);
                    setShowModal(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModalType('view');
                    setFormData(ringGroup);
                    setEditingItem(ringGroup);
                    setShowModal(true);
                  }}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(ringGroup)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredRingGroups.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Ring Groups Found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm ? 'No ring groups match your search criteria.' : 'Create your first ring group to get started.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => {
                setModalType('create');
                setFormData({});
                setShowModal(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Ring Group
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {modalType === 'create' ? 'Create Ring Group' : 
                 modalType === 'edit' ? 'Edit Ring Group' : 'View Ring Group'}
              </CardTitle>
              <CardDescription>
                {modalType === 'create' ? 'Create a new ring group for your team' :
                 modalType === 'edit' ? 'Update ring group settings' :
                 'View ring group details and members'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={modalType === 'view'}
                    placeholder="Sales Team"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Extension</label>
                  <Input
                    value={formData.extension || ''}
                    onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                    disabled={modalType === 'view'}
                    placeholder="2000"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={modalType === 'view'}
                  placeholder="Ring group for sales team members"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Strategy</label>
                  <Select
                    value={formData.strategy || 'ringall'}
                    onValueChange={(value) => setFormData({ ...formData, strategy: value as any })}
                    disabled={modalType === 'view'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ringall">Ring All</SelectItem>
                      <SelectItem value="hunt">Hunt</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
                      <SelectItem value="simultaneous">Simultaneous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Ring Time (seconds)</label>
                  <Input
                    type="number"
                    value={formData.ring_time || 20}
                    onChange={(e) => setFormData({ ...formData, ring_time: parseInt(e.target.value) })}
                    disabled={modalType === 'view'}
                    min="1"
                    max="60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Call Timeout (seconds)</label>
                  <Input
                    type="number"
                    value={formData.call_timeout || 60}
                    onChange={(e) => setFormData({ ...formData, call_timeout: parseInt(e.target.value) })}
                    disabled={modalType === 'view'}
                    min="1"
                    max="300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Concurrent Calls</label>
                  <Input
                    type="number"
                    value={formData.max_concurrent_calls || 10}
                    onChange={(e) => setFormData({ ...formData, max_concurrent_calls: parseInt(e.target.value) })}
                    disabled={modalType === 'view'}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              {/* Voicemail Settings */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Voicemail Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.voicemail_enabled || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, voicemail_enabled: checked })}
                      disabled={modalType === 'view'}
                    />
                    <label className="text-sm font-medium">Enable Voicemail</label>
                  </div>
                  
                  {formData.voicemail_enabled && (
                    <div>
                      <label className="text-sm font-medium">Voicemail Extension</label>
                      <Input
                        value={formData.voicemail_extension || ''}
                        onChange={(e) => setFormData({ ...formData, voicemail_extension: e.target.value })}
                        disabled={modalType === 'view'}
                        placeholder="100"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Members Section */}
              {(modalType === 'edit' || modalType === 'view') && editingItem && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Members</h4>
                  <div className="space-y-2">
                    {editingItem.members.map((member) => (
                      <div key={member.extension_id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{member.extension}</span>
                          <span className="text-sm text-gray-600">- {member.display_name}</span>
                        </div>
                        {modalType === 'edit' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(editingItem.id, member.extension_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {modalType === 'edit' && (
                      <div className="pt-2">
                        <Select onValueChange={(value) => {
                          if (value) {
                            handleAddMember(editingItem.id, value);
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add member..." />
                          </SelectTrigger>
                          <SelectContent>
                            {extensions
                              .filter(ext => !editingItem.members.some(member => member.extension_id === ext.id))
                              .map((ext) => (
                                <SelectItem key={ext.id} value={ext.id}>
                                  {ext.extension} - {ext.display_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({});
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </Button>
                {modalType !== 'view' && (
                  <Button
                    onClick={modalType === 'create' ? handleCreate : handleEdit}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : modalType === 'create' ? 'Create' : 'Update'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
