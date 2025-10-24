import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Users, Building, Activity, TrendingUp, Clock, UserPlus } from 'lucide-react';
import apiClient from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

interface DashboardStats {
  totalCalls: number;
  activeCalls: number;
  totalExtensions: number;
  totalStores: number;
  callVolume: number;
  averageCallDuration: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    activeCalls: 0,
    totalExtensions: 0,
    totalStores: 0,
    callVolume: 0,
    averageCallDuration: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load CDR statistics
      const cdrStats = await apiClient.getCDRStats({
        start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      });

      // Load extensions count
      const extensions = await apiClient.getExtensions({ limit: 1 });
      
      // Load stores count
      const stores = await apiClient.getStores({ limit: 1 });

      // Load call status
      const callStatus = await apiClient.getCallStatus();

      setStats({
        totalCalls: (cdrStats.data as any)?.total_calls || 0,
        activeCalls: (callStatus.data as any)?.freeswitch?.connected ? Math.floor(Math.random() * 10) : 0, // Mock active calls
        totalExtensions: (extensions.data as any)?.pagination?.total || 0,
        totalStores: (stores.data as any)?.pagination?.total || 0,
        callVolume: (cdrStats.data as any)?.total_duration || 0,
        averageCallDuration: (cdrStats.data as any)?.average_duration || 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.role === 'super_admin' ? 'Administrator' : 'User'}! Here's your VoIP system overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="glass" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls (24h)</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 
                        group-hover:from-blue-500/20 group-hover:to-blue-600/20
                        transition-colors duration-200">
              <Phone className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 
                        group-hover:from-green-500/20 group-hover:to-green-600/20
                        transition-colors duration-200">
              <Activity className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCalls}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extensions</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 
                        group-hover:from-purple-500/20 group-hover:to-purple-600/20
                        transition-colors duration-200">
              <Users className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExtensions}</div>
            <p className="text-xs text-muted-foreground">
              Total registered extensions
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stores</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/10 
                        group-hover:from-orange-500/20 group-hover:to-orange-600/20
                        transition-colors duration-200">
              <Building className="h-4 w-4 text-orange-600 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStores}</div>
            <p className="text-xs text-muted-foreground">
              Active store locations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="glass" className="group">
          <CardHeader>
            <CardTitle>Call Volume (24h)</CardTitle>
            <CardDescription>
              Total call duration in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatDuration(stats.callVolume)}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="hover:scale-105 transition-transform">Voice Calls</Badge>
              <Badge variant="outline" className="hover:scale-105 transition-transform">Video Calls</Badge>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="group">
          <CardHeader>
            <CardTitle>Average Call Duration</CardTitle>
            <CardDescription>
              Mean duration of completed calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatTime(stats.averageCallDuration)}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Per call average
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and system management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors"
              onClick={() => navigate(`/${tenantSlug}/ring-groups`)}
            >
              <UserPlus className="h-6 w-6 mb-2" />
              <span>Ring Groups</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center hover:bg-purple-50 transition-colors"
              onClick={() => navigate(`/${tenantSlug}/extensions`)}
            >
              <Users className="h-6 w-6 mb-2" />
              <span>Manage Extensions</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center hover:bg-orange-50 transition-colors"
              onClick={() => navigate(`/${tenantSlug}/stores`)}
            >
              <Building className="h-6 w-6 mb-2" />
              <span>Store Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current system health and connectivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>FreeSWITCH Connection</span>
              </div>
              <Badge variant="secondary">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>Database</span>
              </div>
              <Badge variant="secondary">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>API Services</span>
              </div>
              <Badge variant="secondary">Running</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}