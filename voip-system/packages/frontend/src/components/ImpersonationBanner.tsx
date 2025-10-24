import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Shield, User } from 'lucide-react';
import apiClient from '@/lib/api';

interface ImpersonationInfo {
  originalUser: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  impersonatedAt: string;
}

export default function ImpersonationBanner() {
  const [impersonationInfo, setImpersonationInfo] = useState<ImpersonationInfo | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're impersonating
    const isCurrentlyImpersonating = apiClient.isImpersonating();
    setIsImpersonating(isCurrentlyImpersonating);

    if (isCurrentlyImpersonating) {
      // Load impersonation info
      const info = localStorage.getItem('impersonation_info');
      if (info) {
        try {
          setImpersonationInfo(JSON.parse(info));
        } catch (error) {
          console.error('Failed to parse impersonation info:', error);
        }
      }
    }
  }, []);

  const handleExitImpersonation = () => {
    // Exit impersonation
    apiClient.exitImpersonation();
    
    // Clear impersonation info
    localStorage.removeItem('impersonation_info');
    
    // Reset state
    setIsImpersonating(false);
    setImpersonationInfo(null);
    
    // Redirect to super admin dashboard
    navigate('/edgvoip/dashboard');
  };

  if (!isImpersonating || !impersonationInfo) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Alert className="border-orange-200 bg-orange-50 text-orange-800 rounded-none">
        <Shield className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="font-medium">
                Impersonating: {impersonationInfo.originalUser.first_name} {impersonationInfo.originalUser.last_name}
              </span>
              <span className="text-sm text-orange-600">
                ({impersonationInfo.originalUser.email})
              </span>
            </div>
            <div className="text-sm text-orange-600">
              Started: {new Date(impersonationInfo.impersonatedAt).toLocaleTimeString()}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExitImpersonation}
            className="border-orange-300 text-orange-800 hover:bg-orange-100"
          >
            <X className="h-4 w-4 mr-2" />
            Exit Impersonation
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
