import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Wifi
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface SipTestModalProps {
  children: React.ReactNode;
}

interface SipTestResult {
  success: boolean;
  status: 'REG_OK' | 'FAIL' | 'TIMEOUT' | 'AUTH_FAILED' | 'NETWORK_ERROR';
  message: string;
  response_time_ms?: number;
  error_details?: string;
  registration_details?: {
    expires?: number;
    contact?: string;
    user_agent?: string;
  };
}

export default function SipTestModal({ children }: SipTestModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<SipTestResult | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    provider: 'Messagenet',
    proxy: 'sip.messagenet.it',
    port: 5060,
    transport: 'udp' as 'udp' | 'tcp' | 'tls',
    auth_username: '5406594427',
    auth_password: 'UjcHYnZa'
  });

  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await apiClient.request('/sip-test/test-registration', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      setTestResult(response.data as SipTestResult);
    } catch (error) {
      console.error('SIP test error:', error);
      setTestResult({
        success: false,
        status: 'NETWORK_ERROR',
        message: 'Failed to test connection',
        error_details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestMessagenet = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await apiClient.request('/sip-test/test-messagenet', {
        method: 'POST'
      });
      
      setTestResult(response.data as SipTestResult);
    } catch (error) {
      console.error('Messagenet test error:', error);
      setTestResult({
        success: false,
        status: 'NETWORK_ERROR',
        message: 'Failed to test Messagenet connection',
        error_details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REG_OK':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAIL':
      case 'AUTH_FAILED':
      case 'NETWORK_ERROR':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'TIMEOUT':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REG_OK':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'AUTH_FAILED':
        return <Badge variant="destructive">Auth Failed</Badge>;
      case 'TIMEOUT':
        return <Badge variant="secondary">Timeout</Badge>;
      case 'NETWORK_ERROR':
        return <Badge variant="destructive">Network Error</Badge>;
      default:
        return <Badge variant="secondary">Failed</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <TestTube className="h-5 w-5 mr-2" />
            SIP Connection Test
          </DialogTitle>
          <DialogDescription>
            Test SIP trunk connectivity and registration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Test Buttons */}
          <div className="flex space-x-2">
            <Button 
              onClick={handleTestMessagenet} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <Wifi className="h-4 w-4 mr-2" />
              Test Messagenet
            </Button>
            <Button 
              onClick={handleTestConnection} 
              disabled={loading}
              className="flex-1"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Custom
            </Button>
          </div>

          {/* Configuration Form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData({...formData, provider: e.target.value})}
                placeholder="Provider name"
              />
            </div>
            <div>
              <Label htmlFor="proxy">Proxy/Host</Label>
              <Input
                id="proxy"
                value={formData.proxy}
                onChange={(e) => setFormData({...formData, proxy: e.target.value})}
                placeholder="sip.provider.com"
              />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                placeholder="5060"
              />
            </div>
            <div>
              <Label htmlFor="transport">Transport</Label>
              <Select 
                value={formData.transport} 
                onValueChange={(value: 'udp' | 'tcp' | 'tls') => setFormData({...formData, transport: value})}
              >
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
            <div>
              <Label htmlFor="auth_username">Username</Label>
              <Input
                id="auth_username"
                value={formData.auth_username}
                onChange={(e) => setFormData({...formData, auth_username: e.target.value})}
                placeholder="SIP username"
              />
            </div>
            <div>
              <Label htmlFor="auth_password">Password</Label>
              <Input
                id="auth_password"
                type="password"
                value={formData.auth_password}
                onChange={(e) => setFormData({...formData, auth_password: e.target.value})}
                placeholder="SIP password"
              />
            </div>
          </div>

          {/* Test Results */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getStatusIcon(testResult.status)}
                  <span className="ml-2">Test Results</span>
                </CardTitle>
                <CardDescription>
                  {testResult.message}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(testResult.status)}
                </div>
                
                {testResult.response_time_ms && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time:</span>
                    <span className="text-sm">{testResult.response_time_ms}ms</span>
                  </div>
                )}

                {testResult.registration_details && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Registration Details:</span>
                    <div className="bg-gray-50 p-3 rounded-md space-y-1">
                      {testResult.registration_details.expires && (
                        <div className="text-xs">
                          <span className="font-medium">Expires:</span> {testResult.registration_details.expires}s
                        </div>
                      )}
                      {testResult.registration_details.contact && (
                        <div className="text-xs">
                          <span className="font-medium">Contact:</span> {testResult.registration_details.contact}
                        </div>
                      )}
                      {testResult.registration_details.user_agent && (
                        <div className="text-xs">
                          <span className="font-medium">User Agent:</span> {testResult.registration_details.user_agent}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {testResult.error_details && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-red-600">Error Details:</span>
                    <div className="bg-red-50 p-3 rounded-md">
                      <span className="text-xs text-red-700">{testResult.error_details}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-muted-foreground">Testing connection...</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
