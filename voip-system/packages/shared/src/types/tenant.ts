import { z } from 'zod';

// Tenant base schema
export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/),
  sip_domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/),
  status: z.enum(['active', 'suspended', 'pending']),
  created_at: z.date(),
  updated_at: z.date(),
  settings: z.object({
    max_concurrent_calls: z.number().min(1).max(1000).default(20),
    recording_enabled: z.boolean().default(true),
    gdpr_compliant: z.boolean().default(true),
    timezone: z.string().default('Europe/Rome'),
    language: z.string().default('it')
  })
});

export type Tenant = z.infer<typeof TenantSchema>;

// Store schema
export const StoreSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  store_id: z.string().min(1).max(50), // W3 Suite store ID
  status: z.enum(['active', 'inactive']),
  created_at: z.date(),
  updated_at: z.date(),
  settings: z.object({
    business_hours: z.object({
      enabled: z.boolean().default(true),
      timezone: z.string().default('Europe/Rome'),
      schedule: z.record(z.object({
        open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      }))
    }),
    outbound_caller_id: z.string().optional(),
    recording_consent_required: z.boolean().default(true)
  })
});

export type Store = z.infer<typeof StoreSchema>;

// Extension/Internal schema
export const ExtensionSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  extension: z.string().regex(/^[0-9]{3,6}$/),
  password: z.string().min(8).max(32),
  display_name: z.string().min(1).max(100),
  status: z.enum(['active', 'inactive', 'locked']),
  type: z.enum(['user', 'queue', 'conference', 'voicemail']),
  created_at: z.date(),
  updated_at: z.date(),
  settings: z.object({
    voicemail_enabled: z.boolean().default(true),
    call_forwarding: z.object({
      enabled: z.boolean().default(false),
      destination: z.string().optional()
    }),
    dnd_enabled: z.boolean().default(false),
    recording_enabled: z.boolean().default(true)
  })
});

export type Extension = z.infer<typeof ExtensionSchema>;

