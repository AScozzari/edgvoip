import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mic,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Clock,
  Mail
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface VoicemailBox {
  id: string;
  mailbox_id: string;
  password: string;
  full_name?: string;
  email?: string;
  pager_email?: string;
  timezone: string;
  attach_file: boolean;
  delete_voicemail: boolean;
  say_caller_id: boolean;
  say_caller_id_name: boolean;
  say_envelope: boolean;
  skip_greeting: boolean;
  skip_instructions: boolean;
  email_attachment_format: string;
  voicemail_password?: string;
  max_greeting_length: number;
  max_message_length: number;
  settings: any;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}


export default function Voicemail() {
  const { user } = useAuth();
  const [voicemailBoxes, setVoicemailBoxes] = useState<VoicemailBox[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<VoicemailBox>>({});
  const [editingItem, setEditingItem] = useState<VoicemailBox | null>(null);

  // Load voicemail boxes on component mount
  useEffect(() => {
    loadVoicemailBoxes();
  }, []);

  const loadVoicemailBoxes = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/voicemail-boxes`);
      const data = await response.json();
      
      if (data?.success && Array.isArray(data?.data)) {
        setVoicemailBoxes(data.data);
      } else {
        console.warn('⚠️ Invalid API response format');
        setVoicemailBoxes([]);
      }
    } catch (error) {
      console.error('❌ Error loading voicemail boxes:', error);
      setVoicemailBoxes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/voicemail-boxes`, {
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
        await loadVoicemailBoxes();
        setShowModal(false);
        setFormData({});
      } else {
        console.error('❌ Error creating voicemail box:', data.message);
      }
    } catch (error) {
      console.error('❌ Error creating voicemail box:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/voicemail-boxes/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadVoicemailBoxes();
        setShowModal(false);
        setFormData({});
        setEditingItem(null);
      } else {
        console.error('❌ Error updating voicemail box:', data.message);
      }
    } catch (error) {
      console.error('❌ Error updating voicemail box:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (box: VoicemailBox) => {
    if (!confirm(`Are you sure you want to delete voicemail box "${box.mailbox_id}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/voicemail-boxes/${box.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadVoicemailBoxes();
      } else {
        console.error('❌ Error deleting voicemail box:', data.message);
      }
    } catch (error) {
      console.error('❌ Error deleting voicemail box:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBoxes = voicemailBoxes.filter(box =>
    box.mailbox_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    box.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    box.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voicemail</h1>
          <p className="text-gray-600">Manage voicemail boxes and messages</p>
        </div>
        <Button onClick={() => {
          setModalType('create');
          setFormData({
            timezone: 'UTC',
            attach_file: true,
            delete_voicemail: false,
            say_caller_id: true,
            say_caller_id_name: true,
            say_envelope: true,
            skip_greeting: false,
            skip_instructions: false,
            email_attachment_format: 'wav',
            max_greeting_length: 60,
            max_message_length: 300,
            settings: {}
          });
          setShowModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Voicemail Box
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search voicemail boxes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadVoicemailBoxes} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Voicemail Boxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBoxes.map((box) => (
          <Card key={box.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{box.mailbox_id}</CardTitle>
                  <CardDescription>{box.full_name}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={box.enabled ? 'default' : 'secondary'}>
                    {box.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              {box.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{box.email}</span>
                </div>
              )}

              {/* Timezone */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{box.timezone}</span>
              </div>

              {/* Settings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Attach Files</span>
                  <Badge variant={box.attach_file ? 'default' : 'secondary'}>
                    {box.attach_file ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Say Caller ID</span>
                  <Badge variant={box.say_caller_id ? 'default' : 'secondary'}>
                    {box.say_caller_id ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Max Message Length</span>
                  <span className="text-sm text-gray-600">{box.max_message_length}s</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModalType('edit');
                    setFormData(box);
                    setEditingItem(box);
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
                    setFormData(box);
                    setEditingItem(box);
                    setShowModal(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(box)}
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
      {filteredBoxes.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mic className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Voicemail Boxes Found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm ? 'No voicemail boxes match your search criteria.' : 'Create your first voicemail box to get started.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => {
                setModalType('create');
                setFormData({
                  timezone: 'UTC',
                  attach_file: true,
                  delete_voicemail: false,
                  say_caller_id: true,
                  say_caller_id_name: true,
                  say_envelope: true,
                  skip_greeting: false,
                  skip_instructions: false,
                  email_attachment_format: 'wav',
                  max_greeting_length: 60,
                  max_message_length: 300,
                  settings: {}
                });
                setShowModal(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Voicemail Box
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
                {modalType === 'create' ? 'Create Voicemail Box' : 
                 modalType === 'edit' ? 'Edit Voicemail Box' : 'View Voicemail Box'}
              </CardTitle>
              <CardDescription>
                {modalType === 'create' ? 'Create a new voicemail box' :
                 modalType === 'edit' ? 'Update voicemail box settings' :
                 'View voicemail box details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Mailbox ID</label>
                  <Input
                    value={formData.mailbox_id || ''}
                    onChange={(e) => setFormData({ ...formData, mailbox_id: e.target.value })}
                    disabled={modalType === 'view'}
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={modalType === 'view'}
                    placeholder="1234"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={modalType === 'view'}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={modalType === 'view'}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="text-sm font-medium">Email Attachment Format</label>
                  <Select
                    value={formData.email_attachment_format || 'wav'}
                    onValueChange={(value) => setFormData({ ...formData, email_attachment_format: value })}
                    disabled={modalType === 'view'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wav">WAV</SelectItem>
                      <SelectItem value="mp3">MP3</SelectItem>
                      <SelectItem value="gsm">GSM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <h4 className="font-medium">Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.attach_file || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, attach_file: checked })}
                      disabled={modalType === 'view'}
                    />
                    <label className="text-sm font-medium">Attach Files</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.say_caller_id || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, say_caller_id: checked })}
                      disabled={modalType === 'view'}
                    />
                    <label className="text-sm font-medium">Say Caller ID</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.say_caller_id_name || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, say_caller_id_name: checked })}
                      disabled={modalType === 'view'}
                    />
                    <label className="text-sm font-medium">Say Caller ID Name</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.say_envelope || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, say_envelope: checked })}
                      disabled={modalType === 'view'}
                    />
                    <label className="text-sm font-medium">Say Envelope</label>
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
