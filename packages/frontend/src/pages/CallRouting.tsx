import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function CallRouting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inbound');
  const [loading, setLoading] = useState(false);

  // Inbound Routes
  const [inboundRoutes, setInboundRoutes] = useState<any[]>([]);
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [inboundForm, setInboundForm] = useState({
    name: '',
    did_number: '',
    destination_type: 'extension',
    destination_value: '',
    enabled: true
  });

  // Outbound Routes
  const [outboundRoutes, setOutboundRoutes] = useState<any[]>([]);
  const [showOutboundModal, setShowOutboundModal] = useState(false);
  const [outboundForm, setOutboundForm] = useState({
    name: '',
    dial_pattern: '',
    trunk_id: '',
    strip_digits: 0,
    add_digits: '',
    priority: 100,
    enabled: true
  });

  // Time Conditions
  const [timeConditions, setTimeConditions] = useState<any[]>([]);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeForm, setTimeForm] = useState({
    name: '',
    timezone: 'Europe/Rome',
    business_hours: {},
    after_hours_action: 'voicemail',
    enabled: true
  });

  // Available trunks and extensions for selects
  const [trunks, setTrunks] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inboundRes, outboundRes, timeRes, trunksRes, extensionsRes] = await Promise.all([
        apiClient.get(`/routing/inbound?tenant_id=${user?.tenant_id}`),
        apiClient.get(`/routing/outbound?tenant_id=${user?.tenant_id}`),
        apiClient.get(`/routing/time-conditions?tenant_id=${user?.tenant_id}`),
        apiClient.getSipTrunks(),
        apiClient.getExtensions({ limit: 1000 })
      ]);

      setInboundRoutes(inboundRes.data?.routes || []);
      setOutboundRoutes(outboundRes.data?.routes || []);
      setTimeConditions(timeRes.data?.time_conditions || []);
      setTrunks(Array.isArray(trunksRes.data?.data) ? trunksRes.data.data : []);
      setExtensions(extensionsRes.data?.data?.items || []);
    } catch (error) {
      console.error('Error loading routing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== INBOUND ROUTES ==========
  const handleCreateInbound = async () => {
    try {
      await apiClient.post('/routing/inbound', {
        ...inboundForm,
        tenant_id: user?.tenant_id
      });
      
      await loadData();
      setShowInboundModal(false);
      
      toast({ title: "Successo", description: "Inbound route creata" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteInbound = async (id: string) => {
    if (!confirm('Eliminare questa inbound route?')) return;
    
    try {
      await apiClient.delete(`/routing/inbound/${id}`);
      await loadData();
      toast({ title: "Eliminata", description: "Inbound route eliminata" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  // ========== OUTBOUND ROUTES ==========
  const handleCreateOutbound = async () => {
    try {
      await apiClient.post('/routing/outbound', {
        ...outboundForm,
        tenant_id: user?.tenant_id
      });
      
      await loadData();
      setShowOutboundModal(false);
      
      toast({ title: "Successo", description: "Outbound route creata" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteOutbound = async (id: string) => {
    if (!confirm('Eliminare questa outbound route?')) return;
    
    try {
      await apiClient.delete(`/routing/outbound/${id}`);
      await loadData();
      toast({ title: "Eliminata", description: "Outbound route eliminata" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  // ========== TIME CONDITIONS ==========
  const handleCreateTimeCondition = async () => {
    try {
      await apiClient.post('/routing/time-conditions', {
        ...timeForm,
        tenant_id: user?.tenant_id
      });
      
      await loadData();
      setShowTimeModal(false);
      
      toast({ title: "Successo", description: "Time condition creata" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Call Routing</h1>
        <p className="text-muted-foreground">
          Gestisci instradamento chiamate entranti e uscenti
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbound">Inbound Routes</TabsTrigger>
          <TabsTrigger value="outbound">Outbound Routes</TabsTrigger>
          <TabsTrigger value="time">Time Conditions</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        {/* INBOUND ROUTES TAB */}
        <TabsContent value="inbound">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inbound Routes (Chiamate Entranti)</CardTitle>
              <Button onClick={() => setShowInboundModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuova Route
              </Button>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">DID</th>
                    <th className="text-left p-3">Destinazione</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {inboundRoutes.map((route) => (
                    <tr key={route.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold">{route.name}</td>
                      <td className="p-3 font-mono">{route.did_number || 'ANY'}</td>
                      <td className="p-3">
                        <span className="text-gray-600">{route.destination_type}</span>
                        <ArrowRight className="inline h-3 w-3 mx-1" />
                        <span className="font-mono">{route.destination_value}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant={route.enabled ? 'default' : 'secondary'}>
                          {route.enabled ? 'Attiva' : 'Disattiva'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteInbound(route.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OUTBOUND ROUTES TAB */}
        <TabsContent value="outbound">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Outbound Routes (Chiamate Uscenti)</CardTitle>
              <Button onClick={() => setShowOutboundModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuova Route
              </Button>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Priorità</th>
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Pattern</th>
                    <th className="text-left p-3">Trunk</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {outboundRoutes.map((route) => (
                    <tr key={route.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold">{route.priority}</td>
                      <td className="p-3">{route.name}</td>
                      <td className="p-3 font-mono text-sm">{route.dial_pattern}</td>
                      <td className="p-3">{trunks.find(t => t.id === route.trunk_id)?.name || 'N/A'}</td>
                      <td className="p-3">
                        <Badge variant={route.enabled ? 'default' : 'secondary'}>
                          {route.enabled ? 'Attiva' : 'Disattiva'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteOutbound(route.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIME CONDITIONS TAB */}
        <TabsContent value="time">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Time Conditions (Orari)</CardTitle>
              <Button onClick={() => setShowTimeModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuova Condizione
              </Button>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Timezone</th>
                    <th className="text-left p-3">Azione Orario</th>
                    <th className="text-left p-3">Azione Fuori Orario</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timeConditions.map((cond) => (
                    <tr key={cond.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold">{cond.name}</td>
                      <td className="p-3">{cond.timezone}</td>
                      <td className="p-3">{cond.business_hours_action}</td>
                      <td className="p-3">{cond.after_hours_action}</td>
                      <td className="p-3">
                        <Badge variant={cond.enabled ? 'default' : 'secondary'}>
                          {cond.enabled ? 'Attiva' : 'Disattiva'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMERGENCY TAB */}
        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Numeri di Emergenza</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  I numeri di emergenza (112, 113, 115, 118) sono automaticamente configurati 
                  nel context <code className="bg-gray-100 px-2 py-1 rounded">tenant-{'{'}slug{'}'}-emergency</code>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded p-4">
                    <div className="font-semibold mb-2">112 - Emergenza Generale</div>
                    <p className="text-sm text-gray-600">Carabinieri, Polizia, Vigili del Fuoco</p>
                  </div>
                  <div className="border rounded p-4">
                    <div className="font-semibold mb-2">118 - Emergenza Sanitaria</div>
                    <p className="text-sm text-gray-600">Ambulanza</p>
                  </div>
                  <div className="border rounded p-4">
                    <div className="font-semibold mb-2">113 - Polizia di Stato</div>
                    <p className="text-sm text-gray-600">Soccorso pubblico</p>
                  </div>
                  <div className="border rounded p-4">
                    <div className="font-semibold mb-2">115 - Vigili del Fuoco</div>
                    <p className="text-sm text-gray-600">Emergenze antincendio</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* INBOUND MODAL */}
      <Dialog open={showInboundModal} onOpenChange={setShowInboundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Inbound Route</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Route *</Label>
              <Input
                value={inboundForm.name}
                onChange={(e) => setInboundForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Es. Main Number Route"
              />
            </div>
            <div>
              <Label>Numero DID</Label>
              <Input
                value={inboundForm.did_number}
                onChange={(e) => setInboundForm(prev => ({ ...prev, did_number: e.target.value }))}
                placeholder="Es. 0591234567"
              />
            </div>
            <div>
              <Label>Tipo Destinazione</Label>
              <Select 
                value={inboundForm.destination_type} 
                onValueChange={(val) => setInboundForm(prev => ({ ...prev, destination_type: val }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="extension">Extension</SelectItem>
                  <SelectItem value="ring_group">Ring Group</SelectItem>
                  <SelectItem value="queue">Queue</SelectItem>
                  <SelectItem value="ivr">IVR Menu</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valore Destinazione *</Label>
              {inboundForm.destination_type === 'extension' ? (
                <Select 
                  value={inboundForm.destination_value} 
                  onValueChange={(val) => setInboundForm(prev => ({ ...prev, destination_value: val }))}
                >
                  <SelectTrigger><SelectValue placeholder="Seleziona extension" /></SelectTrigger>
                  <SelectContent>
                    {extensions.map(ext => (
                      <SelectItem key={ext.id} value={ext.extension}>{ext.extension} - {ext.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={inboundForm.destination_value}
                  onChange={(e) => setInboundForm(prev => ({ ...prev, destination_value: e.target.value }))}
                  placeholder="Valore destinazione"
                />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={inboundForm.enabled}
                onCheckedChange={(checked) => setInboundForm(prev => ({ ...prev, enabled: checked }))}
              />
              <Label>Route Abilitata</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowInboundModal(false)}>Annulla</Button>
              <Button onClick={handleCreateInbound}>Crea Route</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* OUTBOUND MODAL */}
      <Dialog open={showOutboundModal} onOpenChange={setShowOutboundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Outbound Route</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Route *</Label>
              <Input
                value={outboundForm.name}
                onChange={(e) => setOutboundForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Es. Mobile Numbers"
              />
            </div>
            <div>
              <Label>Pattern Numero (regex) *</Label>
              <Input
                value={outboundForm.dial_pattern}
                onChange={(e) => setOutboundForm(prev => ({ ...prev, dial_pattern: e.target.value }))}
                placeholder="Es. ^3[0-9]{9}$ per mobili italiani"
              />
            </div>
            <div>
              <Label>Trunk *</Label>
              <Select 
                value={outboundForm.trunk_id} 
                onValueChange={(val) => setOutboundForm(prev => ({ ...prev, trunk_id: val }))}
              >
                <SelectTrigger><SelectValue placeholder="Seleziona trunk" /></SelectTrigger>
                <SelectContent>
                  {trunks.map(trunk => (
                    <SelectItem key={trunk.id} value={trunk.id}>{trunk.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cifre da Rimuovere</Label>
                <Input
                  type="number"
                  min="0"
                  value={outboundForm.strip_digits}
                  onChange={(e) => setOutboundForm(prev => ({ ...prev, strip_digits: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Cifre da Aggiungere</Label>
                <Input
                  value={outboundForm.add_digits}
                  onChange={(e) => setOutboundForm(prev => ({ ...prev, add_digits: e.target.value }))}
                  placeholder="Es. 0"
                />
              </div>
            </div>
            <div>
              <Label>Priorità</Label>
              <Input
                type="number"
                value={outboundForm.priority}
                onChange={(e) => setOutboundForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 100 }))}
              />
              <p className="text-sm text-gray-500 mt-1">Numero più basso = priorità più alta</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={outboundForm.enabled}
                onCheckedChange={(checked) => setOutboundForm(prev => ({ ...prev, enabled: checked }))}
              />
              <Label>Route Abilitata</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowOutboundModal(false)}>Annulla</Button>
              <Button onClick={handleCreateOutbound}>Crea Route</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* TIME CONDITION MODAL */}
      <Dialog open={showTimeModal} onOpenChange={setShowTimeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Time Condition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={timeForm.name}
                onChange={(e) => setTimeForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Es. Orario Ufficio"
              />
            </div>
            <div>
              <Label>Timezone</Label>
              <Select 
                value={timeForm.timezone} 
                onValueChange={(val) => setTimeForm(prev => ({ ...prev, timezone: val }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Rome">Europe/Rome</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Azione Fuori Orario</Label>
              <Select 
                value={timeForm.after_hours_action} 
                onValueChange={(val) => setTimeForm(prev => ({ ...prev, after_hours_action: val }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                  <SelectItem value="external">Numero Esterno</SelectItem>
                  <SelectItem value="hangup">Riaggancia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowTimeModal(false)}>Annulla</Button>
              <Button onClick={handleCreateTimeCondition}>Crea Condizione</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
