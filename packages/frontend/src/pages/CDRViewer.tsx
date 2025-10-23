import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, Filter, Phone, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import apiClient from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CDR {
  id: string;
  call_uuid: string;
  call_direction: 'inbound' | 'outbound' | 'internal';
  call_type: string;
  caller_id_number?: string;
  caller_id_name?: string;
  callee_id_number?: string;
  callee_id_name?: string;
  start_time: string;
  answer_time?: string;
  end_time: string;
  duration: number;
  bill_seconds: number;
  hangup_cause: string;
  hangup_disposition: string;
  recording_enabled: boolean;
  recording_path?: string;
}

export default function CDRViewer() {
  const [cdr, setCdr] = useState<CDR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [dispositionFilter, setDispositionFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadCDR();
  }, []);

  const loadCDR = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getCDR({
        limit: 50,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      });
      setCdr((response.data as any)?.cdr || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load CDR records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCDR = cdr.filter(record => {
    const matchesSearch = 
      record.caller_id_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.callee_id_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.caller_id_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.callee_id_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDirection = directionFilter === 'all' || record.call_direction === directionFilter;
    const matchesDisposition = dispositionFilter === 'all' || record.hangup_disposition === dispositionFilter;
    
    return matchesSearch && matchesDirection && matchesDisposition;
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'inbound':
        return <PhoneIncoming className="h-4 w-4 text-green-600" />;
      case 'outbound':
        return <PhoneOutgoing className="h-4 w-4 text-blue-600" />;
      case 'internal':
        return <Phone className="h-4 w-4 text-purple-600" />;
      default:
        return <Phone className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDispositionBadge = (disposition: string) => {
    switch (disposition) {
      case 'answered':
        return <Badge variant="default">Answered</Badge>;
      case 'no_answer':
        return <Badge variant="secondary">No Answer</Badge>;
      case 'busy':
        return <Badge variant="destructive">Busy</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const exportCDR = async (format: 'csv' | 'json') => {
    try {
      const response = await apiClient.exportCDR(format);
      
      if (format === 'csv') {
        const blob = new Blob([response as any], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cdr_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cdr_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Export successful",
        description: `CDR data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export CDR data",
        variant: "destructive",
      });
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
          <h1 className="text-3xl font-bold tracking-tight">CDR Viewer</h1>
          <p className="text-muted-foreground">
            Call Detail Records and call history
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportCDR('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportCDR('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Direction</label>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Disposition</label>
              <Select value={dispositionFilter} onValueChange={setDispositionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dispositions</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button variant="outline" className="w-full" onClick={loadCDR}>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CDR Table */}
      <Card>
        <CardHeader>
          <CardTitle>Call Records ({filteredCDR.length})</CardTitle>
          <CardDescription>
            Recent call detail records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Direction</th>
                  <th className="text-left p-2">Caller</th>
                  <th className="text-left p-2">Callee</th>
                  <th className="text-left p-2">Start Time</th>
                  <th className="text-left p-2">Duration</th>
                  <th className="text-left p-2">Disposition</th>
                  <th className="text-left p-2">Recording</th>
                </tr>
              </thead>
              <tbody>
                {filteredCDR.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        {getDirectionIcon(record.call_direction)}
                        <span className="capitalize">{record.call_direction}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{record.caller_id_number || 'Unknown'}</div>
                        {record.caller_id_name && (
                          <div className="text-sm text-gray-500">{record.caller_id_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{record.callee_id_number || 'Unknown'}</div>
                        {record.callee_id_name && (
                          <div className="text-sm text-gray-500">{record.callee_id_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      {new Date(record.start_time).toLocaleString()}
                    </td>
                    <td className="p-2">
                      {formatDuration(record.duration)}
                    </td>
                    <td className="p-2">
                      {getDispositionBadge(record.hangup_disposition)}
                    </td>
                    <td className="p-2">
                      {record.recording_enabled ? (
                        <Badge variant="secondary">Available</Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredCDR.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No call records found
              </h3>
              <p className="text-gray-500">
                {searchTerm || directionFilter !== 'all' || dispositionFilter !== 'all' 
                  ? 'Try adjusting your filters.' 
                  : 'No calls have been made yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}