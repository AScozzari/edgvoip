import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, TestTube, Settings, Shield, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrunkSettings {
  name: string;
  provider: string;
  username: string;
  password: string;
  server: string;
  port: number;
  protocol: 'udp' | 'tcp' | 'tls';
  register: boolean;
  caller_id: string;
  recording_enabled: boolean;
  recording_consent: boolean;
  gdpr_compliant: boolean;
  allowed_codecs: string[];
  max_concurrent_calls: number;
}

export default function TrunkRegistration() {
  const [trunkSettings, setTrunkSettings] = useState<TrunkSettings>({
    name: '',
    provider: '',
    username: '',
    password: '',
    server: '',
    port: 5060,
    protocol: 'udp',
    register: true,
    caller_id: '',
    recording_enabled: false,
    recording_consent: false,
    gdpr_compliant: false,
    allowed_codecs: ['PCMU', 'PCMA', 'G722'],
    max_concurrent_calls: 20,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof TrunkSettings, value: any) => {
    setTrunkSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCodecToggle = (codec: string) => {
    setTrunkSettings(prev => ({
      ...prev,
      allowed_codecs: prev.allowed_codecs.includes(codec)
        ? prev.allowed_codecs.filter(c => c !== codec)
        : [...prev.allowed_codecs, codec]
    }));
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Connection test successful",
        description: "SIP trunk configuration is valid",
      });
    } catch (error) {
      toast({
        title: "Connection test failed",
        description: "Please check your configuration",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveTrunk = async () => {
    setIsLoading(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Trunk saved successfully",
        description: "SIP trunk configuration has been saved",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save trunk configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trunk Registration</h1>
          <p className="text-muted-foreground">
            Configure SIP trunk connections for external calling
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={testConnection} disabled={isTesting}>
            <TestTube className="h-4 w-4 mr-2" />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button onClick={saveTrunk} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Trunk'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Basic Configuration
            </CardTitle>
            <CardDescription>
              Essential SIP trunk settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Trunk Name</Label>
              <Input
                id="name"
                value={trunkSettings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter trunk name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={trunkSettings.provider} onValueChange={(value) => handleInputChange('provider', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="vonage">Vonage</SelectItem>
                  <SelectItem value="bandwidth">Bandwidth</SelectItem>
                  <SelectItem value="custom">Custom Provider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={trunkSettings.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="SIP username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={trunkSettings.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="SIP password"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="server">Server</Label>
                <Input
                  id="server"
                  value={trunkSettings.server}
                  onChange={(e) => handleInputChange('server', e.target.value)}
                  placeholder="sip.provider.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={trunkSettings.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                  placeholder="5060"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="protocol">Protocol</Label>
              <Select value={trunkSettings.protocol} onValueChange={(value) => handleInputChange('protocol', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="udp">UDP</SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="tls">TLS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caller_id">Caller ID</Label>
              <Input
                id="caller_id"
                value={trunkSettings.caller_id}
                onChange={(e) => handleInputChange('caller_id', e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="register"
                checked={trunkSettings.register}
                onCheckedChange={(checked) => handleInputChange('register', checked)}
              />
              <Label htmlFor="register">Auto-register with provider</Label>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Security and performance configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Allowed Codecs</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {['PCMU', 'PCMA', 'G722', 'G729', 'OPUS', 'AMR'].map((codec) => (
                  <div key={codec} className="flex items-center space-x-2">
                    <Checkbox
                      id={codec}
                      checked={trunkSettings.allowed_codecs.includes(codec)}
                      onCheckedChange={() => handleCodecToggle(codec)}
                    />
                    <Label htmlFor={codec} className="text-sm">{codec}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_calls">Max Concurrent Calls</Label>
              <Input
                id="max_calls"
                type="number"
                value={trunkSettings.max_concurrent_calls}
                onChange={(e) => handleInputChange('max_concurrent_calls', parseInt(e.target.value))}
                placeholder="20"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="recording_enabled"
                  checked={trunkSettings.recording_enabled}
                  onCheckedChange={(checked) => handleInputChange('recording_enabled', checked)}
                />
                <Label htmlFor="recording_enabled">Enable call recording</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="recording_consent"
                  checked={trunkSettings.recording_consent}
                  onCheckedChange={(checked) => handleInputChange('recording_consent', checked)}
                />
                <Label htmlFor="recording_consent">Require recording consent</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="gdpr_compliant"
                  checked={trunkSettings.gdpr_compliant}
                  onCheckedChange={(checked) => handleInputChange('gdpr_compliant', checked)}
                />
                <Label htmlFor="gdpr_compliant">GDPR compliant</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GDPR Compliance Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            GDPR Compliance
          </CardTitle>
          <CardDescription>
            Data protection and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Recording Consent</h4>
              <p className="text-sm text-blue-800">
                When recording consent is enabled, all calls will require explicit consent from all parties before recording begins.
                This ensures compliance with GDPR and local privacy regulations.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Data Retention</h4>
              <p className="text-sm text-green-800">
                Call recordings and metadata will be automatically deleted according to your data retention policy.
                Users can request data deletion at any time through the GDPR portal.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="gdpr_acknowledge"
                checked={trunkSettings.gdpr_compliant}
                onCheckedChange={(checked) => handleInputChange('gdpr_compliant', checked)}
              />
              <Label htmlFor="gdpr_acknowledge" className="text-sm">
                I acknowledge and agree to comply with GDPR requirements for call recording and data processing.
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}