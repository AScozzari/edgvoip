import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Building2 } from 'lucide-react';
import apiClient from '@/lib/api';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post(`/edgvoip/login`, {
        email,
        password,
      });

      if (response.success && response.data?.token) {
        // Store token
        localStorage.setItem('token', response.data.token);
        apiClient.setToken(response.data.token);

        // Verify user is super admin
        if (response.data.user?.role !== 'super_admin') {
          throw new Error('Access denied. Super admin privileges required.');
        }

        // Redirect to super admin dashboard
        navigate('/edgvoip/dashboard');
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
                bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600
                bg-[length:400%_400%] animate-gradient p-4">
      <Card variant="glass" className="w-full max-w-md p-8">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 shadow-glass">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Super Admin Login
          </CardTitle>
          <CardDescription className="text-white/80">
            Access the EDG VoIP Master Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="glass-light">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@edgvoip.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="glass-input focus:ring-2 focus:ring-purple-500/50 
                          transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="glass-input focus:ring-2 focus:ring-purple-500/50 
                          transition-all duration-200"
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full hover:scale-[1.02] transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Access Master Dashboard
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="text-center text-sm text-white/80">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="h-4 w-4 mr-2" />
                <span>EDG VoIP Master Tenant</span>
              </div>
              <p>Cross-tenant management and analytics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}