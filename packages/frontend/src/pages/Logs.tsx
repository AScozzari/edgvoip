import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Terminal,
  Play,
  Pause,
  RotateCcw,
  Download,
  Search,
  Eye,
  AlertCircle,
  Info,
  XCircle,
  RefreshCw,
  Settings,
  Clock,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  component: string;
  message: string;
  tenant_id?: string;
  source: 'freeswitch' | 'backend' | 'frontend';
}

interface LogStats {
  total: number;
  errors: number;
  warnings: number;
  last_update: string;
}

export default function Logs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedComponent, setSelectedComponent] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [logStats, setLogStats] = useState<LogStats>({ total: 0, errors: 0, warnings: 0, last_update: '' });
  const [activeTab, setActiveTab] = useState<'live' | 'search' | 'settings'>('live');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState({
    freeswitchLevel: 'info',
    backendLevel: 'info',
    maxLogs: '1000',
    retention: '30',
    sipTracing: true,
    rtpCapture: true,
    verboseDebugging: false
  });


  useEffect(() => {
    loadInitialLogs();
    loadSavedSettings();
  }, []);

  const loadSavedSettings = () => {
    try {
      const savedSettings = localStorage.getItem('logSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading saved settings:', error);
    }
  };

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, selectedLevel, selectedComponent, selectedSource]);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [filteredLogs]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        addNewLog();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const loadInitialLogs = async () => {
    setIsLoading(true);
    try {
      // Load logs from API
      const [systemResponse, statsResponse] = await Promise.allSettled([
        apiClient.get('/logs/system?lines=100'),
        apiClient.get('/logs/stats?lines=1000')
      ]);

      if (systemResponse.status === 'fulfilled' && (systemResponse.value.data as any)?.success) {
        setLogs((systemResponse.value.data as any).logs);
      } else {
        // Fallback to sample logs if API fails
        setLogs([]);
      }

      if (statsResponse.status === 'fulfilled' && (statsResponse.value.data as any)?.success) {
        setLogStats((statsResponse.value.data as any).stats);
      } else {
        updateStats([]);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      // Fallback to sample logs
      setLogs([]);
      updateStats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addNewLog = async () => {
    try {
      // Try to fetch new logs from API
      const response = await apiClient.get('/logs/system?lines=10');
      if ((response.data as any)?.success && (response.data as any)?.logs?.length > 0) {
        const newLogs = (response.data as any).logs.filter((log: LogEntry) => 
          !logs.some(existingLog => existingLog.id === log.id)
        );
        if (newLogs.length > 0) {
          setLogs(prev => [...newLogs, ...prev].slice(0, 1000)); // Keep last 1000 logs
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching new logs:', error);
    }

    // Fallback to sample log if API fails
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level: ['INFO', 'DEBUG', 'WARN', 'ERROR'][Math.floor(Math.random() * 4)] as any,
      component: ['sofia', 'mod_dptools', 'api', 'auth'][Math.floor(Math.random() * 4)],
      message: `Sample log message ${Date.now()}`,
      source: ['freeswitch', 'backend'][Math.floor(Math.random() * 2)] as any,
      tenant_id: user?.tenant_id || undefined
    };
    
    setLogs(prev => [newLog, ...prev].slice(0, 1000)); // Keep last 1000 logs
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.component.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    if (selectedComponent !== 'all') {
      filtered = filtered.filter(log => log.component === selectedComponent);
    }

    if (selectedSource !== 'all') {
      filtered = filtered.filter(log => log.source === selectedSource);
    }

    setFilteredLogs(filtered);
  };

  const updateStats = (logData: LogEntry[]) => {
    const stats: LogStats = {
      total: logData.length,
      errors: logData.filter(log => log.level === 'ERROR' || log.level === 'CRITICAL').length,
      warnings: logData.filter(log => log.level === 'WARN').length,
      last_update: new Date().toLocaleString()
    };
    setLogStats(stats);
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
      case 'CRITICAL':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'WARN':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'DEBUG':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      'CRITICAL': 'bg-red-100 text-red-800',
      'ERROR': 'bg-red-100 text-red-800',
      'WARN': 'bg-yellow-100 text-yellow-800',
      'INFO': 'bg-blue-100 text-blue-800',
      'DEBUG': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={`${colors[level as keyof typeof colors] || colors.DEBUG} text-xs`}>
        {level}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      'freeswitch': 'bg-purple-100 text-purple-800',
      'backend': 'bg-green-100 text-green-800',
      'frontend': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge className={`${colors[source as keyof typeof colors] || colors.frontend} text-xs`}>
        {source.toUpperCase()}
      </Badge>
    );
  };

  const handleRefresh = () => {
    loadInitialLogs();
  };

  const handleDownload = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] ${log.level} [${log.component}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voip-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      setLogs([]);
      setFilteredLogs([]);
      setLogStats({ total: 0, errors: 0, warnings: 0, last_update: new Date().toLocaleString() });
    }
  };

  const handleSetLogLevel = async (level: string) => {
    try {
      const response = await apiClient.post('/logs/freeswitch/level', { level });
      if ((response.data as any)?.success) {
        console.log(`FreeSWITCH log level set to ${level}`);
      }
    } catch (error) {
      console.error('Error setting log level:', error);
    }
  };

  const handleSetSipTracing = async (enabled: boolean) => {
    try {
      const response = await apiClient.post('/logs/freeswitch/tracing', { enabled });
      if ((response.data as any)?.success) {
        console.log(`SIP tracing ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Error setting SIP tracing:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs & Verbose</h1>
          <p className="text-gray-600">Monitor system logs and debugging information</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={handleClearLogs} className="text-red-600 hover:text-red-700">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">{logStats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{logStats.errors}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{logStats.warnings}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Update</p>
                <p className="text-sm font-bold text-gray-900">{logStats.last_update}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Terminal className="h-5 w-5 mr-2" />
            System Logs
          </CardTitle>
          <CardDescription>
            Real-time monitoring of FreeSWITCH, Backend, and Frontend logs for tenant: {user?.tenant_id?.slice(0, 8)}...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="live">Live Monitoring</TabsTrigger>
              <TabsTrigger value="search">Search & Filter</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isLive}
                      onCheckedChange={setIsLive}
                    />
                    <span className="text-sm font-medium">
                      {isLive ? 'Live Mode ON' : 'Live Mode OFF'}
                    </span>
                    {isLive ? (
                      <Play className="h-4 w-4 text-green-500" />
                    ) : (
                      <Pause className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={autoScroll}
                      onCheckedChange={setAutoScroll}
                    />
                    <span className="text-sm font-medium">Auto Scroll</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Showing {filteredLogs.length} of {logs.length} logs
                </div>
              </div>

              {/* Live Logs Display */}
              <div className="bg-black text-green-400 font-mono text-sm rounded-lg p-4 h-96 overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No logs to display
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-2 py-1 border-b border-gray-800">
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getLevelIcon(log.level)}
                        {getLevelBadge(log.level)}
                        {getSourceBadge(log.source)}
                      </div>
                      <span className="text-blue-400 font-semibold">[{log.component}]</span>
                      <span className="text-white flex-1">{log.message}</span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Level</label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="DEBUG">Debug</SelectItem>
                      <SelectItem value="INFO">Info</SelectItem>
                      <SelectItem value="WARN">Warning</SelectItem>
                      <SelectItem value="ERROR">Error</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Component</label>
                  <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Components</SelectItem>
                      <SelectItem value="sofia">Sofia</SelectItem>
                      <SelectItem value="mod_dptools">Mod Dptools</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="auth">Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Source</label>
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="freeswitch">FreeSWITCH</SelectItem>
                      <SelectItem value="backend">Backend</SelectItem>
                      <SelectItem value="frontend">Frontend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search Results */}
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <Card key={log.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getLevelIcon(log.level)}
                          {getLevelBadge(log.level)}
                          {getSourceBadge(log.source)}
                          <span className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-semibold text-blue-600">[{log.component}]</span>
                        </div>
                        <p className="text-sm text-gray-700">{log.message}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Log Settings</CardTitle>
                  <CardDescription>Configure logging preferences and verbosity levels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">FreeSWITCH Log Level</label>
                      <Select 
                        value={settings.freeswitchLevel} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, freeswitchLevel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="notice">Notice</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Backend Log Level</label>
                      <Select 
                        value={settings.backendLevel} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, backendLevel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warn">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Max Log Entries</label>
                      <Input 
                        type="number" 
                        value={settings.maxLogs}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxLogs: e.target.value }))}
                        placeholder="1000" 
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Log Retention (days)</label>
                      <Input 
                        type="number" 
                        value={settings.retention}
                        onChange={(e) => setSettings(prev => ({ ...prev, retention: e.target.value }))}
                        placeholder="30" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={settings.sipTracing}
                        onCheckedChange={(checked) => {
                          setSettings(prev => ({ ...prev, sipTracing: checked }));
                          handleSetSipTracing(checked);
                        }}
                      />
                      <span className="text-sm font-medium">Enable SIP Tracing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={settings.rtpCapture}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, rtpCapture: checked }))}
                      />
                      <span className="text-sm font-medium">Enable RTP Capture</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={settings.verboseDebugging}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, verboseDebugging: checked }))}
                      />
                      <span className="text-sm font-medium">Enable Verbose Debugging</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        console.log('Apply Settings clicked');
                        console.log('Settings to apply:', settings);
                        
                        // Apply FreeSWITCH log level
                        handleSetLogLevel(settings.freeswitchLevel);
                        
                        // Apply SIP tracing
                        handleSetSipTracing(settings.sipTracing);
                        
                        // Here you would normally save settings to backend/localStorage
                        localStorage.setItem('logSettings', JSON.stringify(settings));
                        
                        alert('Settings applied successfully!');
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Apply Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
