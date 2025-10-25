import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  EyeOff,
  Rocket
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Extension {
  id?: string;
  extension: string;
  password: string;
  display_name: string;
  status: string;
  context?: string;
  caller_id_number?: string;
  voicemail_pin?: string;
  pickup_group?: string;
  limit_max?: number;
  settings?: any;
  tenant_id?: string;
}

export default function Extensions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editingExtension, setEditingExtension] = useState<Extension | null>(null);

  // Form state with all fields
  const [formData, setFormData] = useState<Extension>({
    extension: '',
    password: '',
    display_name: '',
    status: 'active',
    caller_id_number: '',
    voicemail_pin: '',
    pickup_group: '',
    limit_max: 3,
    settings: {
      voicemail_enabled: true,
      call_forwarding: { enabled: false, destination: '' },
      dnd_enabled: false,
      recording_enabled: false,
      timeout_seconds: 30,
      email: '',
      timezone: 'Europe/Rome',
      notes: '',
      codec_prefs: ['PCMA', 'OPUS'],
      force_tls: false,
      force_srtp: false,
      ip_whitelist: []
    }
  });

  useEffect(() => {
    loadExtensions();
  }, []);

  const loadExtensions = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getExtensions({ limit: 100 });
      
      if (data?.success && data?.data?.items && Array.isArray(data.data.items)) {
        setExtensions(data.data.items);
      } else {
        setExtensions([]);
      }
    } catch (error) {
      console.error('Error loading extensions:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le extensions",
        variant: "destructive"
      });
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    try {
      // Set caller_id_number to extension if empty
      if (!formData.caller_id_number) {
        formData.caller_id_number = formData.extension;
      }

      const response = await apiClient.post('/voip/sip-extensions', {
        ...formData,
        tenant_id: user.tenant_id
      });
      
      await loadExtensions();
      setShowModal(false);
      resetForm();

      toast({
        title: "Successo!",
        description: `Extension ${formData.extension} creata con successo`,
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingExtension?.id) return;
    
    setLoading(true);
    try {
      await apiClient.put(`/voip/sip-extensions/${editingExtension.id}`, formData);
      
      await loadExtensions();
      setShowModal(false);
      resetForm();

      toast({
        title: "Successo!",
        description: `Extension ${formData.extension} aggiornata`,
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndDeploy = async () => {
    // Save first
    if (modalType === 'create') {
      await handleCreate();
    } else {
      await handleUpdate();
    }

    // Then deploy
    if (editingExtension?.id) {
      try {
        await apiClient.post(`/freeswitch-deploy/extension/${editingExtension.id}`, {});
        toast({
          title: "Deploy Completato!",
          description: "Configurazione FreeSWITCH aggiornata",
        });
      } catch (error) {
        console.error('Deploy error:', error);
      }
    }
  };

  const handleDelete = async (extensionId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa extension?')) return;
    
    setLoading(true);
    try {
      await apiClient.delete(`/voip/sip-extensions/${extensionId}`);
      await loadExtensions();

      toast({
        title: "Eliminata",
        description: "Extension eliminata con successo",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setModalType('create');
    setEditingExtension(null);
    setShowModal(true);
  };

  const openEditModal = (extension: Extension) => {
    setFormData({
      ...extension,
      settings: extension.settings || formData.settings
    });
    setModalType('edit');
    setEditingExtension(extension);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      extension: '',
      password: '',
      display_name: '',
      status: 'active',
      caller_id_number: '',
      voicemail_pin: '',
      pickup_group: '',
      limit_max: 3,
      settings: {
        voicemail_enabled: true,
        call_forwarding: { enabled: false, destination: '' },
        dnd_enabled: false,
        recording_enabled: false,
        timeout_seconds: 30,
        email: '',
        timezone: 'Europe/Rome',
        notes: '',
        codec_prefs: ['PCMA', 'OPUS'],
        force_tls: false,
        force_srtp: false,
        ip_whitelist: []
      }
    });
    setEditingExtension(null);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSettings = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, [field]: value }
    }));
  };

  const filteredExtensions = extensions.filter(ext =>
    ext.extension?.includes(searchTerm) ||
    ext.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const password = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    updateFormData('password', password);
  };

  if (loading && extensions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Extensions</h1>
          <p className="text-muted-foreground">
            Gestisci interni telefonici e configurazioni SIP
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Extension
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cerca extension..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadExtensions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Ricarica
        </Button>
      </div>

      {/* Extensions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Elenco Extensions ({filteredExtensions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Extension</th>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Caller ID</th>
                  <th className="text-left p-3">Context</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredExtensions.map((ext) => (
                  <tr key={ext.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono font-semibold">{ext.extension}</td>
                    <td className="p-3">{ext.display_name}</td>
                    <td className="p-3 font-mono text-sm">{ext.caller_id_number || ext.extension}</td>
                    <td className="p-3 text-sm text-gray-600">{ext.context || 'N/A'}</td>
                    <td className="p-3">
                      <Badge variant={ext.status === 'active' ? 'default' : 'secondary'}>
                        {ext.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(ext)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => ext.id && handleDelete(ext.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal with Tabs */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalType === 'create' ? 'Crea Nuova Extension' : `Modifica Extension ${formData.extension}`}
            </DialogTitle>
            <DialogDescription>
              Configura l'estensione SIP e le funzionalità telefoniche
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">Generali</TabsTrigger>
              <TabsTrigger value="calls">Chiamate</TabsTrigger>
              <TabsTrigger value="security">Sicurezza</TabsTrigger>
              <TabsTrigger value="voicemail">Voicemail</TabsTrigger>
              <TabsTrigger value="advanced">Avanzate</TabsTrigger>
            </TabsList>

            {/* TAB: GENERALI */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="extension">Numero Extension *</Label>
                  <Input
                    id="extension"
                    value={formData.extension}
                    onChange={(e) => updateFormData('extension', e.target.value)}
                    placeholder="Es. 1000"
                    disabled={modalType === 'edit'}
                  />
                  <p className="text-sm text-gray-500 mt-1">Numero interno (1000-1999)</p>
                </div>
                <div>
                  <Label htmlFor="display_name">Nome Visualizzato *</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => updateFormData('display_name', e.target.value)}
                    placeholder="Es. Mario Rossi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password SIP *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      placeholder="Password sicura"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                    >
                      Genera
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email (per notifiche)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.settings.email}
                    onChange={(e) => updateSettings('email', e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) => updateFormData('status', checked ? 'active' : 'inactive')}
                />
                <Label>Extension Abilitata</Label>
              </div>
            </TabsContent>

            {/* TAB: CHIAMATE */}
            <TabsContent value="calls" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="caller_id_name">Caller ID Nome</Label>
                  <Input
                    id="caller_id_name"
                    value={formData.display_name}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-sm text-gray-500 mt-1">Usa "Nome Visualizzato" tab Generali</p>
                </div>
                <div>
                  <Label htmlFor="caller_id_number">Caller ID Numero</Label>
                  <Input
                    id="caller_id_number"
                    value={formData.caller_id_number}
                    onChange={(e) => updateFormData('caller_id_number', e.target.value)}
                    placeholder={formData.extension}
                  />
                  <p className="text-sm text-gray-500 mt-1">Numero mostrato nelle chiamate</p>
                </div>
              </div>

              <div>
                <Label htmlFor="timeout">Timeout Squillo (secondi): {formData.settings.timeout_seconds}s</Label>
                <input
                  id="timeout"
                  type="range"
                  min="5"
                  max="60"
                  value={formData.settings.timeout_seconds}
                  onChange={(e) => updateSettings('timeout_seconds', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Switch
                    checked={formData.settings.call_forwarding.enabled}
                    onCheckedChange={(checked) => updateSettings('call_forwarding', { 
                      ...formData.settings.call_forwarding, 
                      enabled: checked 
                    })}
                  />
                  <Label>Deviazione Chiamate</Label>
                </div>
                {formData.settings.call_forwarding.enabled && (
                  <Input
                    placeholder="Numero destinazione"
                    value={formData.settings.call_forwarding.destination}
                    onChange={(e) => updateSettings('call_forwarding', {
                      ...formData.settings.call_forwarding,
                      destination: e.target.value
                    })}
                  />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.settings.dnd_enabled}
                  onCheckedChange={(checked) => updateSettings('dnd_enabled', checked)}
                />
                <Label>Do Not Disturb (DND)</Label>
              </div>

              <div>
                <Label htmlFor="pickup_group">Gruppo Pickup</Label>
                <Input
                  id="pickup_group"
                  value={formData.pickup_group}
                  onChange={(e) => updateFormData('pickup_group', e.target.value)}
                  placeholder="Es. sales, support"
                />
                <p className="text-sm text-gray-500 mt-1">Gruppo per pickup chiamate (*8)</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.settings.recording_enabled}
                  onCheckedChange={(checked) => updateSettings('recording_enabled', checked)}
                />
                <Label>Registrazione Automatica Chiamate</Label>
              </div>
            </TabsContent>

            {/* TAB: SICUREZZA */}
            <TabsContent value="security" className="space-y-4">
              <div>
                <Label htmlFor="limit_max">Max Chiamate Simultanee</Label>
                <Input
                  id="limit_max"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.limit_max}
                  onChange={(e) => updateFormData('limit_max', parseInt(e.target.value) || 3)}
                />
              </div>

              <div>
                <Label>Codec Preferiti</Label>
                <div className="space-y-2">
                  {['PCMA', 'PCMU', 'OPUS', 'G729', 'G722'].map(codec => (
                    <div key={codec} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.settings.codec_prefs.includes(codec)}
                        onChange={(e) => {
                          const newCodecs = e.target.checked
                            ? [...formData.settings.codec_prefs, codec]
                            : formData.settings.codec_prefs.filter((c: string) => c !== codec);
                          updateSettings('codec_prefs', newCodecs);
                        }}
                        className="rounded"
                      />
                      <Label>{codec}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.settings.force_tls}
                  onCheckedChange={(checked) => updateSettings('force_tls', checked)}
                />
                <Label>Forza TLS (Secure Transport)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.settings.force_srtp}
                  onCheckedChange={(checked) => updateSettings('force_srtp', checked)}
                />
                <Label>Forza SRTP (Secure RTP)</Label>
              </div>

              <div>
                <Label htmlFor="ip_whitelist">IP Whitelist (uno per riga)</Label>
                <Textarea
                  id="ip_whitelist"
                  value={formData.settings.ip_whitelist.join('\n')}
                  onChange={(e) => updateSettings('ip_whitelist', e.target.value.split('\n').filter(Boolean))}
                  placeholder="192.168.1.100&#10;10.0.0.50"
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-1">Lascia vuoto per permettere tutti gli IP</p>
              </div>
            </TabsContent>

            {/* TAB: VOICEMAIL */}
            <TabsContent value="voicemail" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.settings.voicemail_enabled}
                  onCheckedChange={(checked) => updateSettings('voicemail_enabled', checked)}
                />
                <Label>Abilita Segreteria Telefonica</Label>
              </div>

              {formData.settings.voicemail_enabled && (
                <>
                  <div>
                    <Label htmlFor="voicemail_pin">PIN Segreteria</Label>
                    <Input
                      id="voicemail_pin"
                      type="password"
                      value={formData.voicemail_pin}
                      onChange={(e) => updateFormData('voicemail_pin', e.target.value)}
                      placeholder="Es. 1234"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.settings.email_notification !== false}
                      onCheckedChange={(checked) => updateSettings('email_notification', checked)}
                    />
                    <Label>Notifica via Email</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.settings.delete_after_email || false}
                      onCheckedChange={(checked) => updateSettings('delete_after_email', checked)}
                    />
                    <Label>Elimina Messaggio Dopo Invio Email</Label>
                  </div>
                </>
              )}
            </TabsContent>

            {/* TAB: AVANZATE */}
            <TabsContent value="advanced" className="space-y-4">
              <div>
                <Label htmlFor="context">Context FreeSWITCH (readonly)</Label>
                <Input
                  id="context"
                  value={formData.context || 'Auto-generato dal tenant'}
                  disabled
                  className="bg-gray-100 font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select 
                  value={formData.settings.timezone} 
                  onValueChange={(val) => updateSettings('timezone', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Rome">Europe/Rome (IT)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (UK)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (US)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Note Amministrative</Label>
                <Textarea
                  id="notes"
                  value={formData.settings.notes}
                  onChange={(e) => updateSettings('notes', e.target.value)}
                  placeholder="Note interne..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              <X className="h-4 w-4 mr-2" />
              Annulla
            </Button>
            <div className="space-x-2">
              <Button 
                variant="default" 
                onClick={modalType === 'create' ? handleCreate : handleUpdate}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvataggio...' : 'Salva'}
              </Button>
              <Button 
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleSaveAndDeploy}
                disabled={loading}
              >
                <Rocket className="h-4 w-4 mr-2" />
                Salva e Deploy FreeSWITCH
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
