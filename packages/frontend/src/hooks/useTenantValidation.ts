import { useState, useEffect } from 'react';

interface TenantValidationResult {
  isValid: boolean | null;
  isLoading: boolean;
  error: string | null;
}

export function useTenantValidation(tenantSlug: string | undefined): TenantValidationResult {
  const [state, setState] = useState<TenantValidationResult>({
    isValid: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!tenantSlug || tenantSlug === 'edgvoip') {
      setState({ isValid: true, isLoading: false, error: null });
      return;
    }

    const validateTenant = async () => {
      try {
        const response = await fetch(`/api/${tenantSlug}/validate`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.status === 404) {
          setState({ isValid: false, isLoading: false, error: 'Tenant not found' });
          return;
        }

        if (response.ok) {
          setState({ isValid: true, isLoading: false, error: null });
        } else {
          setState({ isValid: false, isLoading: false, error: 'Validation failed' });
        }
      } catch (error) {
        setState({ isValid: false, isLoading: false, error: 'Network error' });
      }
    };

    validateTenant();
  }, [tenantSlug]);

  return state;
}
