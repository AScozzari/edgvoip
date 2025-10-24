import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneIncoming, PhoneOutgoing, Mic, MicOff, Square, Pause, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LiveCall {
  id: string;
  uuid: string;
  direction: 'inbound' | 'outbound' | 'internal';
  caller_number: string;
  caller_name?: string;
  callee_number: string;
  callee_name?: string;
  start_time: string;
  duration: number;
  status: 'ringing' | 'answered' | 'on_hold' | 'muted';
  recording: boolean;
}

export default function LiveCalls() {
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLiveCalls();
    
    // Simulate real-time updates
    const interval = setInterval(loadLiveCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadLiveCalls = async () => {
    try {
      // In a real implementation, this would connect to WebSocket or Server-Sent Events
      // For now, we'll simulate some live calls
      const mockCalls: LiveCall[] = [
        {
          id: '1',
          uuid: 'call-uuid-1',
          direction: 'inbound',
          caller_number: '+1234567890',
          caller_name: 'John Doe',
          callee_number: '1001',
          callee_name: 'Reception',
          start_time: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
          duration: 120,
          status: 'answered',
          recording: true,
        },
        {
          id: '2',
          uuid: 'call-uuid-2',
          direction: 'outbound',
          caller_number: '1002',
          caller_name: 'Sales Team',
          callee_number: '+0987654321',
          callee_name: 'Customer',
          start_time: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          duration: 300,
          status: 'answered',
          recording: false,
        },
      ];
      
      setLiveCalls(mockCalls);
    } catch (error) {
      console.error('Failed to load live calls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallAction = async (callUuid: string, action: string) => {
    try {
      // In a real implementation, this would call the API
      toast({
        title: "Action performed",
        description: `${action} action sent for call ${callUuid}`,
      });
    } catch (error) {
      toast({
        title: "Action failed",
        description: `Failed to perform ${action} action`,
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'inbound':
        return <PhoneIncoming className="h-5 w-5 text-green-600" />;
      case 'outbound':
        return <PhoneOutgoing className="h-5 w-5 text-blue-600" />;
      case 'internal':
        return <Phone className="h-5 w-5 text-purple-600" />;
      default:
        return <Phone className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ringing':
        return <Badge variant="secondary">Ringing</Badge>;
      case 'answered':
        return <Badge variant="default">Active</Badge>;
      case 'on_hold':
        return <Badge variant="outline">On Hold</Badge>;
      case 'muted':
        return <Badge variant="destructive">Muted</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Calls</h1>
          <p className="text-muted-foreground">
            Monitor active calls in real-time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live</span>
        </div>
      </div>

      {/* Active Calls Count */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveCalls.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inbound</CardTitle>
            <PhoneIncoming className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveCalls.filter(call => call.direction === 'inbound').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Incoming calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outbound</CardTitle>
            <PhoneOutgoing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveCalls.filter(call => call.direction === 'outbound').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Outgoing calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internal</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveCalls.filter(call => call.direction === 'internal').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Internal calls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Calls List */}
      <div className="grid gap-4">
        {liveCalls.map((call) => (
          <Card key={call.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getDirectionIcon(call.direction)}
                  <div>
                    <CardTitle className="text-lg">
                      {call.caller_number} → {call.callee_number}
                    </CardTitle>
                    <CardDescription>
                      {call.caller_name} → {call.callee_name}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(call.status)}
                  {call.recording && (
                    <Badge variant="destructive">Recording</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Duration:</span>
                    <span className="ml-2 text-muted-foreground">
                      {formatDuration(call.duration)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Started:</span>
                    <span className="ml-2 text-muted-foreground">
                      {new Date(call.start_time).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Call UUID:</span>
                    <span className="ml-2 text-muted-foreground font-mono text-xs">
                      {call.uuid}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCallAction(call.uuid, 'hold')}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Hold
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCallAction(call.uuid, 'mute')}
                  >
                    {call.status === 'muted' ? (
                      <MicOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Mic className="h-4 w-4 mr-1" />
                    )}
                    {call.status === 'muted' ? 'Unmute' : 'Mute'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCallAction(call.uuid, 'record')}
                  >
                    {call.recording ? (
                      <Square className="h-4 w-4 mr-1" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    {call.recording ? 'Stop Recording' : 'Start Recording'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCallAction(call.uuid, 'hangup')}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Hangup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {liveCalls.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No active calls
              </h3>
              <p className="text-gray-500">
                There are currently no active calls in the system.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}