import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Users,
  Clock,
  Activity,
  MoreHorizontal,
  UserMinus,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';

interface CallQueue {
  id: string;
  name: string;
  description?: string;
  extension: string;
  strategy: 'ring-all' | 'longest-idle' | 'round-robin' | 'top-down' | 'agent-with-least-talk-time';
  max_wait_time: number;
  agents: Array<{
    id: string;
    extension_id: string;
    agent_name: string;
    agent_type: 'callback' | 'uuid-standby' | 'uuid-bridge';
    contact: string;
    status: 'Available' | 'On Break' | 'Logged Out';
    state: 'Waiting' | 'Receiving' | 'In a queue call';
    tier_level: number;
    tier_position: number;
    calls_answered: number;
    talk_time: number;
    enabled: boolean;
  }>;
  queue_timeout: number;
  queue_timeout_action: 'hangup' | 'voicemail' | 'forward';
  enabled: boolean;
  current_calls: number;
  max_concurrent_calls: number;
}

interface Extension {
  id: string;
  extension: string;
  display_name: string;
}

export default function Queues() {
  const { user } = useAuth();
  const { apiCall } = useAuthenticatedApi();
  const [queues, setQueues] = useState<CallQueue[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<CallQueue>>({});
  const [editingItem, setEditingItem] = useState<CallQueue | null>(null);


  // Load queues on component mount
  useEffect(() => {
    if (user) {
      loadQueues();
      loadExtensions();
    }
  }, [user]);

  const loadQueues = async () => {
    if (!user) {
      console.warn('⚠️ User not authenticated, skipping queue load');
      return;
    }
    
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await apiCall(`${API_BASE_URL}/queues`);
      const data = await response.json();
      
      if (data?.success && Array.isArray(data?.data)) {
        setQueues(data.data);
      } else {
        console.warn('⚠️ Invalid API response format');
        setQueues([]);
      }
    } catch (error) {
      console.error('❌ Error loading queues:', error);
      setQueues([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExtensions = async () => {
    if (!user) {
      console.warn('⚠️ User not authenticated, skipping extensions load');
      return;
    }
    
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await apiCall(`${API_BASE_URL}/extensions`);
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
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/queues`, {
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
        await loadQueues();
        setShowModal(false);
        setFormData({});
      } else {
        console.error('❌ Error creating queue:', data.message);
      }
    } catch (error) {
      console.error('❌ Error creating queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/queues/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadQueues();
        setShowModal(false);
        setFormData({});
        setEditingItem(null);
      } else {
        console.error('❌ Error updating queue:', data.message);
      }
    } catch (error) {
      console.error('❌ Error updating queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (queue: CallQueue) => {
    if (!confirm(`Are you sure you want to delete queue "${queue.name}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/queues/${queue.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadQueues();
      } else {
        console.error('❌ Error deleting queue:', data.message);
      }
    } catch (error) {
      console.error('❌ Error deleting queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async (queueId: string, extensionId: string) => {
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/queues/${queueId}/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extension_id: extensionId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadQueues();
      } else {
        console.error('❌ Error adding agent:', data.message);
      }
    } catch (error) {
      console.error('❌ Error adding agent:', error);
    }
  };

  const handleRemoveAgent = async (queueId: string, extensionId: string) => {
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/queues/${queueId}/agents/${extensionId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadQueues();
      } else {
        console.error('❌ Error removing agent:', data.message);
      }
    } catch (error) {
      console.error('❌ Error removing agent:', error);
    }
  };

  const filteredQueues = queues.filter(queue =>
    queue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    queue.extension.includes(searchTerm) ||
    queue.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'ring-all': return 'Ring All';
      case 'longest-idle': return 'Longest Idle';
      case 'round-robin': return 'Round Robin';
      case 'top-down': return 'Top Down';
      case 'agent-with-least-talk-time': return 'Least Talk Time';
      default: return strategy;
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'ring-all': return 'bg-blue-100 text-blue-800';
      case 'longest-idle': return 'bg-green-100 text-green-800';
      case 'round-robin': return 'bg-purple-100 text-purple-800';
      case 'top-down': return 'bg-orange-100 text-orange-800';
      case 'agent-with-least-talk-time': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'On Break': return 'bg-yellow-100 text-yellow-800';
      case 'Logged Out': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call Queues</h1>
          <p className="text-gray-600">Manage call queues for distributing calls to agents</p>
        </div>
        <Button onClick={() => {
          setModalType('create');
          setFormData({});
          setShowModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Queue
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search queues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadQueues} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Queues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQueues.map((queue) => (
          <Card key={queue.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{queue.name}</CardTitle>
                  <CardDescription>{queue.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={queue.enabled ? 'default' : 'secondary'}>
                    {queue.enabled ? 'Active' : 'Inactive'}
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
                  <span className="font-medium">{queue.extension}</span>
                </div>
                <Badge className={getStrategyColor(queue.strategy)}>
                  {getStrategyLabel(queue.strategy)}
                </Badge>
              </div>

              {/* Agents */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {queue.agents.length} agent{queue.agents.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Agent Status */}
                <div className="space-y-1">
                  {queue.agents.slice(0, 3).map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{agent.agent_name}</span>
                      <Badge className={`${getAgentStatusColor(agent.status)} text-xs`}>
                        {agent.status}
                      </Badge>
                    </div>
                  ))}
                  {queue.agents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{queue.agents.length - 3} more agents
                    </div>
                  )}
                </div>
              </div>

              {/* Wait Time */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {Math.floor(queue.max_wait_time / 60)}m max wait
                </span>
              </div>

              {/* Current Activity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {queue.current_calls}/{queue.max_concurrent_calls} calls
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {queue.current_calls > 0 ? (
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
                    setFormData(queue);
                    setEditingItem(queue);
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
                    setFormData(queue);
                    setEditingItem(queue);
                    setShowModal(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(queue)}
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
      {filteredQueues.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Queues Found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm ? 'No queues match your search criteria.' : 'Create your first call queue to get started.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => {
                setModalType('create');
                setFormData({});
                setShowModal(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Queue
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
                {modalType === 'create' ? 'Create Call Queue' : 
                 modalType === 'edit' ? 'Edit Call Queue' : 'View Call Queue'}
              </CardTitle>
              <CardDescription>
                {modalType === 'create' ? 'Create a new call queue for your agents' :
                 modalType === 'edit' ? 'Update queue settings' :
                 'View queue details and agents'}
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
                    placeholder="Support Queue"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Extension</label>
                  <Input
                    value={formData.extension || ''}
                    onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                    disabled={modalType === 'view'}
                    placeholder="3000"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={modalType === 'view'}
                  placeholder="Call queue for customer support"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Strategy</label>
                  <Select
                    value={formData.strategy || 'ring-all'}
                    onValueChange={(value) => setFormData({ ...formData, strategy: value as any })}
                    disabled={modalType === 'view'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ring-all">Ring All</SelectItem>
                      <SelectItem value="longest-idle">Longest Idle</SelectItem>
                      <SelectItem value="round-robin">Round Robin</SelectItem>
                      <SelectItem value="top-down">Top Down</SelectItem>
                      <SelectItem value="agent-with-least-talk-time">Least Talk Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Max Wait Time (seconds)</label>
                  <Input
                    type="number"
                    value={formData.max_wait_time || 300}
                    onChange={(e) => setFormData({ ...formData, max_wait_time: parseInt(e.target.value) })}
                    disabled={modalType === 'view'}
                    min="1"
                    max="3600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Queue Timeout (seconds)</label>
                  <Input
                    type="number"
                    value={formData.queue_timeout || 60}
                    onChange={(e) => setFormData({ ...formData, queue_timeout: parseInt(e.target.value) })}
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

              {/* Timeout Action */}
              <div>
                <label className="text-sm font-medium">Timeout Action</label>
                <Select
                  value={formData.queue_timeout_action || 'hangup'}
                  onValueChange={(value) => setFormData({ ...formData, queue_timeout_action: value as any })}
                  disabled={modalType === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hangup">Hangup</SelectItem>
                    <SelectItem value="voicemail">Voicemail</SelectItem>
                    <SelectItem value="forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Agents Section */}
              {(modalType === 'edit' || modalType === 'view') && editingItem && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Agents</h4>
                  <div className="space-y-2">
                    {editingItem.agents.map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{agent.agent_name}</span>
                          <Badge className={`${getAgentStatusColor(agent.status)} text-xs`}>
                            {agent.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            T{agent.tier_level}.{agent.tier_position}
                          </span>
                          {modalType === 'edit' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveAgent(editingItem.id, agent.extension_id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {modalType === 'edit' && (
                      <div className="pt-2">
                        <Select onValueChange={(value) => {
                          if (value) {
                            handleAddAgent(editingItem.id, value);
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add agent..." />
                          </SelectTrigger>
                          <SelectContent>
                            {extensions
                              .filter(ext => !editingItem.agents.some(agent => agent.extension_id === ext.id))
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
