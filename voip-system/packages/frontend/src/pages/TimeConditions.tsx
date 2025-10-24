import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock,
  Settings,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Calendar,
  Phone,
  Users,
  Menu,
  Mic,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TimeCondition {
  id: string;
  name: string;
  description?: string;
  timezone: string;
  conditions: Array<{
    day_of_week: number; // 0-6 (Sunday-Saturday)
    start_time: string; // HH:MM format
    end_time: string; // HH:MM format
    is_active: boolean;
  }>;
  action_true: {
    type: 'extension' | 'voicemail' | 'queue' | 'ivr' | 'hangup';
    destination: string;
    timeout?: number;
  };
  action_false: {
    type: 'extension' | 'voicemail' | 'queue' | 'ivr' | 'hangup';
    destination: string;
    timeout?: number;
  };
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export default function TimeConditions() {
  const { user } = useAuth();
  const [timeConditions, setTimeConditions] = useState<TimeCondition[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<TimeCondition>>({});
  const [editingItem, setEditingItem] = useState<TimeCondition | null>(null);

  // Load time conditions on component mount
  useEffect(() => {
    loadTimeConditions();
  }, []);

  const loadTimeConditions = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/time-conditions`);
      const data = await response.json();
      
      if (data?.success && Array.isArray(data?.data)) {
        setTimeConditions(data.data);
      } else {
        console.warn('⚠️ Invalid API response format');
        setTimeConditions([]);
      }
    } catch (error) {
      console.error('❌ Error loading time conditions:', error);
      setTimeConditions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/time-conditions`, {
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
        await loadTimeConditions();
        setShowModal(false);
        setFormData({});
      } else {
        console.error('❌ Error creating time condition:', data.message);
      }
    } catch (error) {
      console.error('❌ Error creating time condition:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/time-conditions/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadTimeConditions();
        setShowModal(false);
        setFormData({});
        setEditingItem(null);
      } else {
        console.error('❌ Error updating time condition:', data.message);
      }
    } catch (error) {
      console.error('❌ Error updating time condition:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (condition: TimeCondition) => {
    if (!confirm(`Are you sure you want to delete time condition "${condition.name}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/time-conditions/${condition.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadTimeConditions();
      } else {
        console.error('❌ Error deleting time condition:', data.message);
      }
    } catch (error) {
      console.error('❌ Error deleting time condition:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConditions = timeConditions.filter(condition =>
    condition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    condition.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'extension': return <Phone className="h-4 w-4" />;
      case 'queue': return <Users className="h-4 w-4" />;
      case 'ivr': return <Menu className="h-4 w-4" />;
      case 'voicemail': return <Mic className="h-4 w-4" />;
      case 'hangup': return <PhoneCall className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'extension': return 'Extension';
      case 'queue': return 'Queue';
      case 'ivr': return 'IVR';
      case 'voicemail': return 'Voicemail';
      case 'hangup': return 'Hangup';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'extension': return 'bg-blue-100 text-blue-800';
      case 'queue': return 'bg-green-100 text-green-800';
      case 'ivr': return 'bg-purple-100 text-purple-800';
      case 'voicemail': return 'bg-orange-100 text-orange-800';
      case 'hangup': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Conditions</h1>
          <p className="text-gray-600">Create time-based call routing rules</p>
        </div>
        <Button onClick={() => {
          setModalType('create');
          setFormData({
            timezone: 'UTC',
            conditions: [],
            action_true: { type: 'extension', destination: '' },
            action_false: { type: 'hangup', destination: '' }
          });
          setShowModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Time Condition
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search time conditions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadTimeConditions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Time Conditions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConditions.map((condition) => (
          <Card key={condition.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{condition.name}</CardTitle>
                  <CardDescription>{condition.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={condition.enabled ? 'default' : 'secondary'}>
                    {condition.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timezone */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{condition.timezone}</span>
              </div>

              {/* Conditions */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {condition.conditions.length} condition{condition.conditions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Time Conditions Preview */}
                <div className="space-y-1">
                  {condition.conditions.slice(0, 2).map((timeCondition, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">{getDayName(timeCondition.day_of_week)}</span>
                        <span className="text-gray-500">
                          {timeCondition.start_time} - {timeCondition.end_time}
                        </span>
                      </div>
                      <Badge className={`${timeCondition.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} text-xs`}>
                        {timeCondition.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                  {condition.conditions.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{condition.conditions.length - 2} more conditions
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">True Action:</span>
                  <Badge className={`${getActionColor(condition.action_true.type)} text-xs flex items-center space-x-1`}>
                    {getActionIcon(condition.action_true.type)}
                    <span>{getActionLabel(condition.action_true.type)}</span>
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">False Action:</span>
                  <Badge className={`${getActionColor(condition.action_false.type)} text-xs flex items-center space-x-1`}>
                    {getActionIcon(condition.action_false.type)}
                    <span>{getActionLabel(condition.action_false.type)}</span>
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModalType('edit');
                    setFormData(condition);
                    setEditingItem(condition);
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
                    setFormData(condition);
                    setEditingItem(condition);
                    setShowModal(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(condition)}
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
      {filteredConditions.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Time Conditions Found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm ? 'No time conditions match your search criteria.' : 'Create your first time condition to get started.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => {
                setModalType('create');
                setFormData({
                  timezone: 'UTC',
                  conditions: [],
                  action_true: { type: 'extension', destination: '' },
                  action_false: { type: 'hangup', destination: '' }
                });
                setShowModal(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Time Condition
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {modalType === 'create' ? 'Create Time Condition' : 
                 modalType === 'edit' ? 'Edit Time Condition' : 'View Time Condition'}
              </CardTitle>
              <CardDescription>
                {modalType === 'create' ? 'Create a new time-based routing rule' :
                 modalType === 'edit' ? 'Update time condition settings' :
                 'View time condition details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={modalType === 'view'}
                    placeholder="Business Hours"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Timezone</label>
                  <Select
                    value={formData.timezone || 'UTC'}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                    disabled={modalType === 'view'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Europe/Rome">Europe/Rome</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={modalType === 'view'}
                  placeholder="Route calls during business hours"
                />
              </div>

              {/* Time Conditions */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Time Conditions</h4>
                <div className="space-y-3">
                  {(formData.conditions || []).map((condition, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded">
                      <div className="w-32">
                        <Select
                          value={condition.day_of_week.toString()}
                          onValueChange={(value) => {
                            const newConditions = [...(formData.conditions || [])];
                            newConditions[index].day_of_week = parseInt(value);
                            setFormData({ ...formData, conditions: newConditions });
                          }}
                          disabled={modalType === 'view'}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Sunday</SelectItem>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Input
                          type="time"
                          value={condition.start_time}
                          onChange={(e) => {
                            const newConditions = [...(formData.conditions || [])];
                            newConditions[index].start_time = e.target.value;
                            setFormData({ ...formData, conditions: newConditions });
                          }}
                          disabled={modalType === 'view'}
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="time"
                          value={condition.end_time}
                          onChange={(e) => {
                            const newConditions = [...(formData.conditions || [])];
                            newConditions[index].end_time = e.target.value;
                            setFormData({ ...formData, conditions: newConditions });
                          }}
                          disabled={modalType === 'view'}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={condition.is_active}
                          onCheckedChange={(checked) => {
                            const newConditions = [...(formData.conditions || [])];
                            newConditions[index].is_active = checked;
                            setFormData({ ...formData, conditions: newConditions });
                          }}
                          disabled={modalType === 'view'}
                        />
                        <label className="text-sm">Active</label>
                      </div>
                      {modalType !== 'view' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newConditions = [...(formData.conditions || [])];
                            newConditions.splice(index, 1);
                            setFormData({ ...formData, conditions: newConditions });
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {modalType !== 'view' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newConditions = [...(formData.conditions || [])];
                        newConditions.push({
                          day_of_week: 1,
                          start_time: '09:00',
                          end_time: '17:00',
                          is_active: true
                        });
                        setFormData({ ...formData, conditions: newConditions });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Condition
                    </Button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">True Action</label>
                  <div className="space-y-2">
                    <Select
                      value={formData.action_true?.type || 'extension'}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        action_true: { ...formData.action_true!, type: value as any }
                      })}
                      disabled={modalType === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="extension">Extension</SelectItem>
                        <SelectItem value="queue">Queue</SelectItem>
                        <SelectItem value="ivr">IVR</SelectItem>
                        <SelectItem value="voicemail">Voicemail</SelectItem>
                        <SelectItem value="hangup">Hangup</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={formData.action_true?.destination || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        action_true: { ...formData.action_true!, destination: e.target.value }
                      })}
                      disabled={modalType === 'view'}
                      placeholder="Destination"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">False Action</label>
                  <div className="space-y-2">
                    <Select
                      value={formData.action_false?.type || 'hangup'}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        action_false: { ...formData.action_false!, type: value as any }
                      })}
                      disabled={modalType === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="extension">Extension</SelectItem>
                        <SelectItem value="queue">Queue</SelectItem>
                        <SelectItem value="ivr">IVR</SelectItem>
                        <SelectItem value="voicemail">Voicemail</SelectItem>
                        <SelectItem value="hangup">Hangup</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={formData.action_false?.destination || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        action_false: { ...formData.action_false!, destination: e.target.value }
                      })}
                      disabled={modalType === 'view'}
                      placeholder="Destination"
                    />
                  </div>
                </div>
              </div>

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
