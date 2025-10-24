import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Phone, Lock, User } from 'lucide-react';
import apiClient from '@/lib/api';

interface LoginProps {
  tenantSlug: string;
}

export default function Login({ tenantSlug }: LoginProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect is now handled by AuthContext

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call the tenant-scoped login API
      const response = await fetch(`/api/${tenantSlug}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data?.token) {
        // Use AuthContext login function to update auth state
        await login(data.data.token);
        
        toast({
          title: "Login successful",
          description: `Welcome to ${data.data.user.tenantSlug}`,
        });
        
        // Navigate to tenant dashboard
        navigate(`/${tenantSlug}/dashboard`);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
                bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600
                bg-[length:400%_400%] animate-gradient py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full 
                        bg-white/20 backdrop-blur-sm border border-white/30 shadow-glass">
            <Phone className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            EDG VoIP System
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Enterprise Multi-tenant VoIP Platform
          </p>
        </div>

        <Card variant="glass" className="p-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">Sign in to your account</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the VoIP management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="glass-input pl-10 focus:ring-2 focus:ring-blue-500/50 
                              transition-all duration-200"
                    placeholder="Enter your email"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="glass-input pl-10 focus:ring-2 focus:ring-blue-500/50 
                              transition-all duration-200"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full hover:scale-[1.02] transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Demo credentials:</p>
              <div className="text-xs text-gray-500 space-y-1">
                {tenantSlug === 'demo' && (
                  <div>👨‍💼 Demo Tenant Admin: admin@demo.local / tenantadmin123</div>
                )}
                {tenantSlug === 'edgvoip' && (
                  <div>👑 Super Admin: admin@edgvoip.local / admin123</div>
                )}
                {tenantSlug !== 'demo' && tenantSlug !== 'edgvoip' && (
                  <>
                    <div>👨‍💼 Tenant Admin: tenantadmin@edgvoip.local / tenantadmin123</div>
                    <div>👤 Regular User: user@edgvoip.local / user123</div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}