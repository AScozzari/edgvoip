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
  Plus, Search, Edit, Trash2, RefreshCw, Eye, EyeOff, Rocket, TestTube, WifiOff, Wifi
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SipTrunk {
  id?: string;
  name: string;
  provider: string;
  status: string;
  sip_config: any;
  did_config: any;
  outbound_caller_id?: string;
  inbound_dids?: string[];
  failover_trunk_id?: string;
  max_concurrent_calls?: number;
  codec_prefs?: string;
  tenant_id?: string;
}

export default function SipTrunks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trunks, setTrunks] = useState<SipTrunk[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editingTrunk, setEditingTrunk] = useState<SipTrunk | null>(null);

  const [formData, setFormData] = useState<SipTrunk>({
    name: '',
    provider: 'Messagenet',
    status: 'testing',
    outbound_caller_id: '',
    inbound_dids: [],
    max_concurrent_calls: 10,
    codec_prefs: 'PCMA,OPUS,G729',
    sip_config: {
      host: '',
      port: 5060,
      username: '',
      password: '',
      transport: 'udp',
      register: false,
      auth_realm: ''
    },
    did_config: {
      main_number: '',
      did_pool: []
    }
  });

  useEffect(() => {
    loadTrunks();
  }, []);

  const loadTrunks = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getSipTrunks();
      if (data?.success && data?.data) {
        setTrunks(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error loading trunks:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i trunk",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    try {
      await apiClient.post('/sip-trunks', {
        ...formData,
        tenant_id: user.tenant_id
      });
      
      await loadTrunks();
      setShowModal(false);
      resetForm();

      toast({
        title: "Successo!",
        description: `Trunk ${formData.name} creato`,
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
    if (!editingTrunk?.id) return;
    
    setLoading(true);
    try {
      await apiClient.put(`/sip-trunks/${editingTrunk.id}`, formData);
      
      await loadTrunks();
      setShowModal(false);
      resetForm();

      toast({
        title: "Successo!",
        description: `Trunk ${formData.name} aggiornato`,
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

  const handleTestCall = async (trunkId: string) => {
    try {
      toast({
        title: "Test in corso...",
        description: "Verifica connessione trunk",
      });
      
      await apiClient.post('/sip-test/originate', { trunk_id: trunkId });
      
      toast({
        title: "Test completato",
        description: "Verifica i log per i risultati",
      });
    } catch (error) {
      toast({
        title: "Test fallito",
        description: "Errore durante il test",
        variant: "destructive"
      });
    }
  };

  const handleSaveAndDeploy = async () => {
    if (modalType === 'create') {
      await handleCreate();
    } else {
      await handleUpdate();
    }

    if (editingTrunk?.id) {
      try {
        await apiClient.post(`/freeswitch-deploy/trunk/${editingTrunk.id}`, {});
        toast({
          title: "Deploy Completato!",
          description: "Configurazione FreeSWITCH aggiornata",
        });
      } catch (error) {
        console.error('Deploy error:', error);
      }
    }
  };

  const handleDelete = async (trunkId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo trunk?')) return;
    
    setLoading(true);
    try {
      await apiClient.delete(`/sip-trunks/${trunkId}`);
      await loadTrunks();

      toast({
        title: "Eliminato",
        description: "Trunk eliminato con successo",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setModalType('create');
    setEditingTrunk(null);
    setShowModal(true);
  };

  const openEditModal = (trunk: SipTrunk) => {
    setFormData(trunk);
    setModalType('edit');
    setEditingTrunk(trunk);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'Messagenet',
      status: 'testing',
      outbound_caller_id: '',
      inbound_dids: [],
      max_concurrent_calls: 10,
      codec_prefs: 'PCMA,OPUS,G729',
      sip_config: {
        host: '',
        port: 5060,
        username: '',
        password: '',
        transport: 'udp',
        register: false,
        auth_realm: ''
      },
      did_config: {
        main_number: '',
        did_pool: []
      }
    });
    setEditingTrunk(null);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSipConfig = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sip_config: { ...prev.sip_config, [field]: value }
    }));
  };

  const filteredTrunks = trunks.filter(trunk =>
    trunk.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trunk.provider?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SIP Trunks</h1>
          <p className="text-muted-foreground">
            Gestisci connessioni verso provider VoIP esterni
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Trunk
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cerca trunk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadTrunks}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Ricarica
        </Button>
      </div>

      {/* Trunks Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTrunks.map((trunk) => (
          <Card key={trunk.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{trunk.name}</CardTitle>
                <Badge variant={trunk.status === 'active' ? 'default' : 'secondary'}>
                  {trunk.status === 'active' ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                  {trunk.status}
                </Badge>
              </div>
              <CardDescription>{trunk.provider}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Host:</span>
                  <span className="font-mono">{trunk.sip_config?.host}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Caller ID:</span>
                  <span className="font-mono">{trunk.outbound_caller_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">DIDs:</span>
                  <span>{trunk.inbound_dids?.length || 0}</span>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(trunk)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Modifica
                </Button>
                <Button variant="outline" size="sm" onClick={() => trunk.id && handleTestCall(trunk.id)}>
                  <TestTube className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => trunk.id && handleDelete(trunk.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal with Tabs */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalType === 'create' ? 'Crea Nuovo Trunk' : `Modifica Trunk ${formData.name}`}
            </DialogTitle>
            <DialogDescription>
              Configura la connessione verso il provider VoIP
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="provider" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="provider">Provider</TabsTrigger>
              <TabsTrigger value="auth">Autenticazione</TabsTrigger>
              <TabsTrigger value="inbound">Inbound</TabsTrigger>
              <TabsTrigger value="outbound">Outbound</TabsTrigger>
              <TabsTrigger value="security">Sicurezza</TabsTrigger>
            </TabsList>

            {/* TAB: DATI PROVIDER */}
            <TabsContent value="provider" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Trunk *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Es. Messagenet Main"
                  />
                </div>
                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Select value={formData.provider} onValueChange={(val) => updateFormData('provider', val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Messagenet">Messagenet</SelectItem>
                      <SelectItem value="VoipVoice">VoipVoice</SelectItem>
                      <SelectItem value="Clouditalia">Clouditalia</SelectItem>
                      <SelectItem value="Terravox">Terravox</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="host">Host SIP *</Label>
                  <Input
                    id="host"
                    value={formData.sip_config.host}
                    onChange={(e) => updateSipConfig('host', e.target.value)}
                    placeholder="sip.provider.it"
                  />
                </div>
                <div>
                  <Label htmlFor="port">Porta</Label>
                  <Input
                    id="port"
                    type="number"
                    value={formData.sip_config.port}
                    onChange={(e) => updateSipConfig('port', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="transport">Transport</Label>
                <Select value={formData.sip_config.transport} onValueChange={(val) => updateSipConfig('transport', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="tls">TLS (Secure)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* TAB: AUTENTICAZIONE */}
            <TabsContent value="auth" className="space-y-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.sip_config.username}
                  onChange={(e) => updateSipConfig('username', e.target.value)}
                  placeholder="User SIP"
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.sip_config.password}
                    onChange={(e) => updateSipConfig('password', e.target.value)}
                    placeholder="Password SIP"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="auth_realm">Realm (opzionale)</Label>
                <Input
                  id="auth_realm"
                  value={formData.sip_config.auth_realm}
                  onChange={(e) => updateSipConfig('auth_realm', e.target.value)}
                  placeholder="Lascia vuoto per auto"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.sip_config.register}
                  onCheckedChange={(checked) => updateSipConfig('register', checked)}
                />
                <Label>Registrazione SIP Attiva</Label>
              </div>
            </TabsContent>

            {/* TAB: INBOUND */}
            <TabsContent value="inbound" className="space-y-4">
              <div>
                <Label htmlFor="inbound_dids">Numeri DID Entranti (uno per riga)</Label>
                <Textarea
                  id="inbound_dids"
                  value={formData.inbound_dids?.join('\n') || ''}
                  onChange={(e) => updateFormData('inbound_dids', e.target.value.split('\n').filter(Boolean))}
                  placeholder="0591234567&#10;0591234568&#10;+390591234569"
                  rows={6}
                />
                <p className="text-sm text-gray-500 mt-1">Numeri assegnati da provider per chiamate entranti</p>
              </div>
            </TabsContent>

            {/* TAB: OUTBOUND */}
            <TabsContent value="outbound" className="space-y-4">
              <div>
                <Label htmlFor="outbound_caller_id">Caller ID Uscente</Label>
                <Input
                  id="outbound_caller_id"
                  value={formData.outbound_caller_id}
                  onChange={(e) => updateFormData('outbound_caller_id', e.target.value)}
                  placeholder="Es. 0591234567"
                />
                <p className="text-sm text-gray-500 mt-1">Numero visualizzato per chiamate uscenti</p>
              </div>

              <div>
                <Label htmlFor="codec_prefs">Codec Preferiti (separati da virgola)</Label>
                <Input
                  id="codec_prefs"
                  value={formData.codec_prefs}
                  onChange={(e) => updateFormData('codec_prefs', e.target.value)}
                  placeholder="PCMA,OPUS,G729"
                />
              </div>

              <div>
                <Label htmlFor="max_concurrent_calls">Max Chiamate Simultanee</Label>
                <Input
                  id="max_concurrent_calls"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.max_concurrent_calls}
                  onChange={(e) => updateFormData('max_concurrent_calls', parseInt(e.target.value) || 10)}
                />
              </div>

              <div>
                <Label htmlFor="failover_trunk_id">Trunk Failover (opzionale)</Label>
                <Select 
                  value={formData.failover_trunk_id || ''} 
                  onValueChange={(val) => updateFormData('failover_trunk_id', val || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nessun failover" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nessuno</SelectItem>
                    {trunks.filter(t => t.id !== editingTrunk?.id).map(trunk => (
                      <SelectItem key={trunk.id} value={trunk.id!}>{trunk.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* TAB: SICUREZZA */}
            <TabsContent value="security" className="space-y-4">
              <div>
                <Label>Encryption</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="encryption"
                      checked={formData.sip_config.transport === 'udp'}
                      onChange={() => updateSipConfig('transport', 'udp')}
                    />
                    <Label>Nessuna (UDP)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="encryption"
                      checked={formData.sip_config.transport === 'tcp'}
                      onChange={() => updateSipConfig('transport', 'tcp')}
                    />
                    <Label>TCP</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="encryption"
                      checked={formData.sip_config.transport === 'tls'}
                      onChange={() => updateSipConfig('transport', 'tls')}
                    />
                    <Label>TLS (Secure)</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label>Stato Trunk</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant={formData.status === 'active' ? 'default' : 'secondary'} className="px-3 py-1">
                    {formData.status === 'active' && <Wifi className="h-3 w-3 mr-1" />}
                    {formData.status !== 'active' && <WifiOff className="h-3 w-3 mr-1" />}
                    {formData.status}
                  </Badge>
                  <Select value={formData.status} onValueChange={(val) => updateFormData('status', val)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)}>
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
