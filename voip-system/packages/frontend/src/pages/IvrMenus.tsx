import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Clock,
  Settings,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Hash,
  PhoneCall,
  Users,
  MessageSquare,
  Mic,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface IvrMenu {
  id: string;
  name: string;
  description?: string;
  extension: string;
  greeting_sound?: string;
  invalid_sound?: string;
  exit_sound?: string;
  timeout: number;
  max_failures: number;
  timeout_action: {
    type: 'extension' | 'voicemail' | 'queue' | 'hangup' | 'repeat';
    destination: string;
  };
  invalid_action: {
    type: 'extension' | 'voicemail' | 'queue' | 'hangup' | 'repeat';
    destination: string;
  };
  options: { [key: string]: {
    action: 'extension' | 'voicemail' | 'queue' | 'hangup' | 'submenu' | 'conference';
    destination: string;
    description?: string;
  }};
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export default function IvrMenus() {
  const { user } = useAuth();
  const [ivrMenus, setIvrMenus] = useState<IvrMenu[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<IvrMenu>>({});
  const [editingItem, setEditingItem] = useState<IvrMenu | null>(null);

  // Load IVR menus on component mount
  useEffect(() => {
    loadIvrMenus();
  }, []);

  const loadIvrMenus = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://192.168.172.234:3000/api';
      const response = await fetch(`${API_BASE_URL}/ivr-menus`);
      const data = await response.json();
      
      if (data?.success && Array.isArray(data?.data)) {
        setIvrMenus(data.data);
      } else {
        console.warn('⚠️ Invalid API response format');
        setIvrMenus([]);
      }
    } catch (error) {
      console.error('❌ Error loading IVR menus:', error);
      setIvrMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://192.168.172.234:3000/api';
      const response = await fetch(`${API_BASE_URL}/ivr-menus`, {
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
        await loadIvrMenus();
        setShowModal(false);
        setFormData({});
      } else {
        console.error('❌ Error creating IVR menu:', data.message);
      }
    } catch (error) {
      console.error('❌ Error creating IVR menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://192.168.172.234:3000/api';
      const response = await fetch(`${API_BASE_URL}/ivr-menus/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadIvrMenus();
        setShowModal(false);
        setFormData({});
        setEditingItem(null);
      } else {
        console.error('❌ Error updating IVR menu:', data.message);
      }
    } catch (error) {
      console.error('❌ Error updating IVR menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ivrMenu: IvrMenu) => {
    if (!confirm(`Are you sure you want to delete IVR menu "${ivrMenu.name}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://192.168.172.234:3000/api';
      const response = await fetch(`${API_BASE_URL}/ivr-menus/${ivrMenu.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadIvrMenus();
      } else {
        console.error('❌ Error deleting IVR menu:', data.message);
      }
    } catch (error) {
      console.error('❌ Error deleting IVR menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIvrMenus = ivrMenus.filter(menu =>
    menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    menu.extension.includes(searchTerm) ||
    menu.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'extension': return <Phone className="h-4 w-4" />;
      case 'queue': return <Users className="h-4 w-4" />;
      case 'conference': return <MessageSquare className="h-4 w-4" />;
      case 'voicemail': return <Mic className="h-4 w-4" />;
      case 'submenu': return <ArrowRight className="h-4 w-4" />;
      case 'hangup': return <PhoneCall className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'extension': return 'Extension';
      case 'queue': return 'Queue';
      case 'conference': return 'Conference';
      case 'voicemail': return 'Voicemail';
      case 'submenu': return 'Submenu';
      case 'hangup': return 'Hangup';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'extension': return 'bg-blue-100 text-blue-800';
      case 'queue': return 'bg-green-100 text-green-800';
      case 'conference': return 'bg-purple-100 text-purple-800';
      case 'voicemail': return 'bg-orange-100 text-orange-800';
      case 'submenu': return 'bg-pink-100 text-pink-800';
      case 'hangup': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IVR Menus</h1>
          <p className="text-gray-600">Create and manage Interactive Voice Response menus</p>
        </div>
        <Button onClick={() => {
          setModalType('create');
          setFormData({
            timeout: 10,
            max_failures: 3,
            timeout_action: { type: 'hangup', destination: '' },
            invalid_action: { type: 'hangup', destination: '' },
            options: {}
          });
          setShowModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add IVR Menu
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search IVR menus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadIvrMenus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* IVR Menus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIvrMenus.map((menu) => (
          <Card key={menu.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{menu.name}</CardTitle>
                  <CardDescription>{menu.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={menu.enabled ? 'default' : 'secondary'}>
                    {menu.enabled ? 'Active' : 'Inactive'}
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
                <span className="font-medium">{menu.extension}</span>
              </div>

              {/* Timeout Settings */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{menu.timeout}s timeout</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span>{menu.max_failures} max tries</span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {Object.keys(menu.options).length} option{Object.keys(menu.options).length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* DTMF Options Preview */}
                <div className="space-y-1">
                  {Object.entries(menu.options).slice(0, 3).map(([dtmf, option]) => (
                    <div key={dtmf} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono bg-gray-100 px-1 rounded">{dtmf}</span>
                        <span className="text-gray-600">{option.description || option.destination}</span>
                      </div>
                      <Badge className={`${getActionColor(option.action)} text-xs flex items-center space-x-1`}>
                        {getActionIcon(option.action)}
                        <span>{getActionLabel(option.action)}</span>
                      </Badge>
                    </div>
                  ))}
                  {Object.keys(menu.options).length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{Object.keys(menu.options).length - 3} more options
                    </div>
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
                    setFormData(menu);
                    setEditingItem(menu);
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
                    setFormData(menu);
                    setEditingItem(menu);
                    setShowModal(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(menu)}
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
      {filteredIvrMenus.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No IVR Menus Found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm ? 'No IVR menus match your search criteria.' : 'Create your first IVR menu to get started.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => {
                setModalType('create');
                setFormData({
                  timeout: 10,
                  max_failures: 3,
                  timeout_action: { type: 'hangup', destination: '' },
                  invalid_action: { type: 'hangup', destination: '' },
                  options: {}
                });
                setShowModal(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create IVR Menu
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
                {modalType === 'create' ? 'Create IVR Menu' : 
                 modalType === 'edit' ? 'Edit IVR Menu' : 'View IVR Menu'}
              </CardTitle>
              <CardDescription>
                {modalType === 'create' ? 'Create a new Interactive Voice Response menu' :
                 modalType === 'edit' ? 'Update IVR menu settings' :
                 'View IVR menu details and options'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={modalType === 'view'}
                    placeholder="Main Menu"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Extension</label>
                  <Input
                    value={formData.extension || ''}
                    onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                    disabled={modalType === 'view'}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={modalType === 'view'}
                  placeholder="Main customer service menu"
                />
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Timeout (seconds)</label>
                  <Input
                    type="number"
                    value={formData.timeout || 10}
                    onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                    disabled={modalType === 'view'}
                    min="1"
                    max="60"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Failures</label>
                  <Input
                    type="number"
                    value={formData.max_failures || 3}
                    onChange={(e) => setFormData({ ...formData, max_failures: parseInt(e.target.value) })}
                    disabled={modalType === 'view'}
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              {/* DTMF Options */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">DTMF Options</h4>
                <div className="space-y-3">
                  {Object.entries(formData.options || {}).map(([dtmf, option], index) => (
                    <div key={dtmf} className="flex items-center space-x-3 p-3 border rounded">
                      <div className="w-16">
                        <Input
                          value={dtmf}
                          onChange={(e) => {
                            const newOptions = { ...formData.options };
                            delete newOptions[dtmf];
                            newOptions[e.target.value] = option;
                            setFormData({ ...formData, options: newOptions });
                          }}
                          disabled={modalType === 'view'}
                          placeholder="1"
                          className="text-center font-mono"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={option.description || ''}
                          onChange={(e) => {
                            const newOptions = { ...formData.options };
                            newOptions[dtmf] = { ...option, description: e.target.value };
                            setFormData({ ...formData, options: newOptions });
                          }}
                          disabled={modalType === 'view'}
                          placeholder="Option description"
                        />
                      </div>
                      <div className="w-32">
                        <Select
                          value={option.action}
                          onValueChange={(value) => {
                            const newOptions = { ...formData.options };
                            newOptions[dtmf] = { ...option, action: value as any };
                            setFormData({ ...formData, options: newOptions });
                          }}
                          disabled={modalType === 'view'}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="extension">Extension</SelectItem>
                            <SelectItem value="queue">Queue</SelectItem>
                            <SelectItem value="conference">Conference</SelectItem>
                            <SelectItem value="voicemail">Voicemail</SelectItem>
                            <SelectItem value="submenu">Submenu</SelectItem>
                            <SelectItem value="hangup">Hangup</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Input
                          value={option.destination}
                          onChange={(e) => {
                            const newOptions = { ...formData.options };
                            newOptions[dtmf] = { ...option, destination: e.target.value };
                            setFormData({ ...formData, options: newOptions });
                          }}
                          disabled={modalType === 'view'}
                          placeholder="Destination"
                        />
                      </div>
                      {modalType !== 'view' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newOptions = { ...formData.options };
                            delete newOptions[dtmf];
                            setFormData({ ...formData, options: newOptions });
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
                        const newOptions = { ...formData.options || {} };
                        const nextKey = Object.keys(newOptions).length.toString();
                        newOptions[nextKey] = {
                          action: 'hangup',
                          destination: '',
                          description: ''
                        };
                        setFormData({ ...formData, options: newOptions });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  )}
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
