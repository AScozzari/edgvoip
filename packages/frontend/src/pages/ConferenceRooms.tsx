import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Users,
  Mic,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Hash,
  Lock,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ConferenceRoom {
  id: string;
  name: string;
  description?: string;
  extension: string;
  pin?: string;
  moderator_pin?: string;
  max_members: number;
  record: boolean;
  record_path?: string;
  moh_sound?: string;
  announce_sound?: string;
  settings: any;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}


export default function ConferenceRooms() {
  const { user } = useAuth();
  const [conferenceRooms, setConferenceRooms] = useState<ConferenceRoom[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<ConferenceRoom>>({});
  const [editingItem, setEditingItem] = useState<ConferenceRoom | null>(null);

  // Load conference rooms on component mount
  useEffect(() => {
    loadConferenceRooms();
  }, []);

  const loadConferenceRooms = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/conference-rooms`);
      const data = await response.json();
      
      if (data?.success && Array.isArray(data?.data)) {
        setConferenceRooms(data.data);
      } else {
        console.warn('⚠️ Invalid API response format');
        setConferenceRooms([]);
      }
    } catch (error) {
      console.error('❌ Error loading conference rooms:', error);
      setConferenceRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/conference-rooms`, {
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
        await loadConferenceRooms();
        setShowModal(false);
        setFormData({});
      } else {
        console.error('❌ Error creating conference room:', data.message);
      }
    } catch (error) {
      console.error('❌ Error creating conference room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/conference-rooms/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadConferenceRooms();
        setShowModal(false);
        setFormData({});
        setEditingItem(null);
      } else {
        console.error('❌ Error updating conference room:', data.message);
      }
    } catch (error) {
      console.error('❌ Error updating conference room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (room: ConferenceRoom) => {
    if (!confirm(`Are you sure you want to delete conference room "${room.name}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/conference-rooms/${room.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadConferenceRooms();
      } else {
        console.error('❌ Error deleting conference room:', data.message);
      }
    } catch (error) {
      console.error('❌ Error deleting conference room:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = conferenceRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.extension.includes(searchTerm) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conference Rooms</h1>
          <p className="text-gray-600">Create and manage audio conference rooms</p>
        </div>
        <Button onClick={() => {
          setModalType('create');
          setFormData({
            max_members: 50,
            record: false,
            settings: {}
          });
          setShowModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Conference Room
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conference rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadConferenceRooms} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Conference Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <Card key={room.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{room.name}</CardTitle>
                  <CardDescription>{room.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={room.enabled ? 'default' : 'secondary'}>
                    {room.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Extension */}
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{room.extension}</span>
              </div>

              {/* PINs */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {room.pin && (
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span>PIN: {room.pin}</span>
                  </div>
                )}
                {room.moderator_pin && (
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-gray-500" />
                    <span>Mod: {room.moderator_pin}</span>
                  </div>
                )}
              </div>

              {/* Max Members */}
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Max {room.max_members} members
                </span>
              </div>

              {/* Recording */}
              {room.record && (
                <div className="flex items-center space-x-2">
                  <Mic className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Recording enabled</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModalType('edit');
                    setFormData(room);
                    setEditingItem(room);
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
                    setFormData(room);
                    setEditingItem(room);
                    setShowModal(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(room)}
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
      {filteredRooms.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Conference Rooms Found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm ? 'No conference rooms match your search criteria.' : 'Create your first conference room to get started.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => {
                setModalType('create');
                setFormData({
                  max_members: 50,
                  record: false,
                  settings: {}
                });
                setShowModal(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Conference Room
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
                {modalType === 'create' ? 'Create Conference Room' : 
                 modalType === 'edit' ? 'Edit Conference Room' : 'View Conference Room'}
              </CardTitle>
              <CardDescription>
                {modalType === 'create' ? 'Create a new audio conference room' :
                 modalType === 'edit' ? 'Update conference room settings' :
                 'View conference room details'}
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
                    placeholder="Sales Conference"
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
                  placeholder="Sales team conference room"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Participant PIN (optional)</label>
                  <Input
                    value={formData.pin || ''}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    disabled={modalType === 'view'}
                    placeholder="1234"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Moderator PIN (optional)</label>
                  <Input
                    value={formData.moderator_pin || ''}
                    onChange={(e) => setFormData({ ...formData, moderator_pin: e.target.value })}
                    disabled={modalType === 'view'}
                    placeholder="5678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Members</label>
                  <Input
                    type="number"
                    value={formData.max_members || 50}
                    onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
                    disabled={modalType === 'view'}
                    min="2"
                    max="1000"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={formData.record || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, record: checked })}
                    disabled={modalType === 'view'}
                  />
                  <label className="text-sm font-medium">Enable Recording</label>
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
