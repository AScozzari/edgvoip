import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, Rocket, Play, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

/**
 * Visual Dialplan Editor
 * 
 * Simplified version without React Flow (to avoid additional dependencies)
 * Uses a list-based approach for creating dialplan rules
 */

interface DialplanRule {
  id?: string;
  name: string;
  context: string;
  priority: number;
  match_pattern: string;
  match_condition?: any;
  actions: RuleAction[];
  enabled: boolean;
}

interface RuleAction {
  type: 'bridge' | 'transfer' | 'answer' | 'playback' | 'hangup' | 'set' | 'voicemail';
  target?: string;
  data?: string;
  cause?: string;
}

export default function DialplanEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedContext, setSelectedContext] = useState('tenant-demo-internal');
  const [rules, setRules] = useState<DialplanRule[]>([]);
  const [editingRule, setEditingRule] = useState<DialplanRule | null>(null);
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [xmlPreview, setXmlPreview] = useState('');
  const [showXmlPreview, setShowXmlPreview] = useState(false);
  const [testNumber, setTestNumber] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const contexts = [
    'tenant-demo-internal',
    'tenant-demo-outbound',
    'tenant-demo-external',
    'tenant-demo-features',
    'tenant-demo-voicemail',
    'tenant-demo-emergency',
  ];

  const actionTypes = [
    { value: 'bridge', label: 'Bridge (Connetti)' },
    { value: 'transfer', label: 'Transfer (Trasferisci)' },
    { value: 'answer', label: 'Answer (Rispondi)' },
    { value: 'playback', label: 'Playback (Riproduci)' },
    { value: 'hangup', label: 'Hangup (Riaggancia)' },
    { value: 'set', label: 'Set (Imposta Variabile)' },
    { value: 'voicemail', label: 'Voicemail (Segreteria)' },
  ];

  const loadRules = async () => {
    try {
      const response = await apiClient.get(`/dialplan/rules?tenant_id=${user?.tenant_id}&context=${selectedContext}`);
      if (response.data?.success) {
        setRules(response.data.data.rules || []);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  };

  const handleCreateRule = () => {
    setEditingRule({
      name: '',
      context: selectedContext,
      priority: 100,
      match_pattern: '',
      actions: [{ type: 'bridge', target: '' }],
      enabled: true,
    });
    setShowRuleEditor(true);
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;

    try {
      if (editingRule.id) {
        await apiClient.put(`/dialplan/rules/${editingRule.id}`, editingRule);
        toast({ title: "Successo", description: "Regola aggiornata" });
      } else {
        await apiClient.post('/dialplan/rules', {
          ...editingRule,
          tenant_id: user?.tenant_id,
        });
        toast({ title: "Successo", description: "Regola creata" });
      }

      setShowRuleEditor(false);
      setEditingRule(null);
      await loadRules();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio",
        variant: "destructive",
      });
    }
  };

  const handleTestPattern = async () => {
    if (!editingRule?.match_pattern || !testNumber) return;

    try {
      const response = await apiClient.post('/dialplan/test-pattern', {
        pattern: editingRule.match_pattern,
        number: testNumber,
      });

      setTestResult(response.data.data);

      if (response.data.data.match) {
        toast({ title: "Match!", description: `Il pattern corrisponde al numero ${testNumber}` });
      } else {
        toast({ title: "No Match", description: "Il pattern non corrisponde", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  const handleGenerateXMLPreview = async () => {
    if (!editingRule) return;

    // Generate XML preview (simplified)
    const xml = `<extension name="${editingRule.name}">
  <condition field="destination_number" expression="${editingRule.match_pattern}">
${editingRule.actions.map(action => {
  switch (action.type) {
    case 'bridge':
      return `    <action application="bridge" data="${action.target}"/>`;
    case 'transfer':
      return `    <action application="transfer" data="${action.target}"/>`;
    case 'answer':
      return `    <action application="answer"/>`;
    case 'playback':
      return `    <action application="playback" data="${action.data}"/>`;
    case 'hangup':
      return `    <action application="hangup"${action.cause ? ` data="${action.cause}"` : ''}/>`;
    case 'set':
      return `    <action application="set" data="${action.data}"/>`;
    case 'voicemail':
      return `    <action application="voicemail" data="${action.data}"/>`;
    default:
      return '';
  }
}).join('\n')}
  </condition>
</extension>`;

    setXmlPreview(xml);
    setShowXmlPreview(true);
  };

  const handleDeployDialplan = async () => {
    if (!user?.tenant_id) return;

    try {
      await apiClient.post(`/freeswitch-deploy/tenant/${user.tenant_id}`, {});
      toast({
        title: "Deploy Completato!",
        description: "Configurazione FreeSWITCH aggiornata",
      });
    } catch (error: any) {
      toast({
        title: "Errore Deploy",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addAction = () => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      actions: [...editingRule.actions, { type: 'bridge', target: '' }],
    });
  };

  const updateAction = (index: number, field: string, value: any) => {
    if (!editingRule) return;
    const newActions = [...editingRule.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setEditingRule({ ...editingRule, actions: newActions });
  };

  const removeAction = (index: number) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      actions: editingRule.actions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dialplan Editor</h1>
          <p className="text-muted-foreground">
            Editor visuale per regole dialplan FreeSWITCH
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadRules}>
            Carica Regole
          </Button>
          <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleDeployDialplan}>
            <Rocket className="h-4 w-4 mr-2" />
            Deploy FreeSWITCH
          </Button>
        </div>
      </div>

      {/* Context Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Seleziona Context</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedContext} onValueChange={setSelectedContext}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contexts.map((ctx) => (
                <SelectItem key={ctx} value={ctx}>
                  {ctx}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Regole Dialplan - {selectedContext}</CardTitle>
          <Button onClick={handleCreateRule}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Regola
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="border rounded p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setEditingRule(rule);
                  setShowRuleEditor(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{rule.name}</div>
                    <div className="text-sm text-gray-600 font-mono">Pattern: {rule.match_pattern}</div>
                    <div className="text-sm text-gray-600">
                      {rule.actions.length} action(s) | Priority: {rule.priority}
                    </div>
                  </div>
                  <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                    {rule.enabled ? 'Attiva' : 'Disattiva'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rule Editor Modal */}
      {showRuleEditor && editingRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <CardTitle>{editingRule.id ? 'Modifica Regola' : 'Nuova Regola'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rule Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome Regola *</Label>
                  <Input
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    placeholder="Es. Internal Calls"
                  />
                </div>
                <div>
                  <Label>Priorità</Label>
                  <Input
                    type="number"
                    value={editingRule.priority}
                    onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 100 })}
                  />
                  <p className="text-sm text-gray-500 mt-1">Numero più basso = priorità più alta</p>
                </div>
              </div>

              {/* Pattern Matching */}
              <div>
                <Label>Pattern Regex *</Label>
                <Input
                  value={editingRule.match_pattern}
                  onChange={(e) => setEditingRule({ ...editingRule, match_pattern: e.target.value })}
                  placeholder="Es. ^(1\d{3})$ per interni 1000-1999"
                  className="font-mono"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Esempi: ^(1\d{'{'}3{'}'})$ = 1000-1999 | ^0(\d+)$ = numeri con 0 | ^329(\d{'{'}7{'}'})$ = mobili 329
                </p>
              </div>

              {/* Test Pattern */}
              <div className="border rounded p-4 bg-gray-50">
                <Label>Test Pattern</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    placeholder="Es. 1001 o 3297626144"
                  />
                  <Button onClick={handleTestPattern}>
                    <Play className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
                {testResult && (
                  <div className="mt-2">
                    <Badge variant={testResult.match ? 'default' : 'destructive'}>
                      {testResult.match ? '✓ Match' : '✗ No Match'}
                    </Badge>
                    {testResult.groups && testResult.groups.length > 0 && (
                      <div className="text-sm mt-2">
                        Capture Groups: {testResult.groups.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Actions (Azioni da Eseguire)</Label>
                  <Button size="sm" onClick={addAction}>
                    + Aggiungi Azione
                  </Button>
                </div>

                <div className="space-y-3">
                  {editingRule.actions.map((action, index) => (
                    <div key={index} className="border rounded p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <Label className="text-sm">Azione {index + 1}</Label>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeAction(index)}
                        >
                          Rimuovi
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Tipo</Label>
                          <Select
                            value={action.type}
                            onValueChange={(val: any) => updateAction(index, 'type', val)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {actionTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {(action.type === 'bridge' || action.type === 'transfer') && (
                          <div>
                            <Label className="text-xs">Target</Label>
                            <Input
                              value={action.target || ''}
                              onChange={(e) => updateAction(index, 'target', e.target.value)}
                              placeholder="Es. user/$1@${domain_name}"
                              className="font-mono text-sm"
                            />
                          </div>
                        )}

                        {(action.type === 'playback' || action.type === 'set' || action.type === 'voicemail') && (
                          <div>
                            <Label className="text-xs">Data</Label>
                            <Input
                              value={action.data || ''}
                              onChange={(e) => updateAction(index, 'data', e.target.value)}
                              placeholder={
                                action.type === 'playback'
                                  ? 'Es. ivr/ivr-welcome.wav'
                                  : action.type === 'set'
                                  ? 'Es. hangup_after_bridge=true'
                                  : 'Es. default ${domain_name} $1'
                              }
                              className="font-mono text-sm"
                            />
                          </div>
                        )}

                        {action.type === 'hangup' && (
                          <div>
                            <Label className="text-xs">Causa (opzionale)</Label>
                            <Input
                              value={action.cause || ''}
                              onChange={(e) => updateAction(index, 'cause', e.target.value)}
                              placeholder="Es. NORMAL_CLEARING"
                              className="font-mono text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setShowRuleEditor(false)}>
                  Annulla
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleGenerateXMLPreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview XML
                  </Button>
                  <Button onClick={handleSaveRule}>
                    <Save className="h-4 w-4 mr-2" />
                    Salva Regola
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* XML Preview Modal */}
      {showXmlPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <CardTitle>XML Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
                <code>{xmlPreview}</code>
              </pre>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setShowXmlPreview(false)}>Chiudi</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

