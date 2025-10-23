import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { body, param, query, validationResult } from 'express-validator';
import { TenantSchema, StoreSchema, ExtensionSchema, SipTrunkSchema, TrunkRegistrationSchema, CDRFilterSchema } from '@w3-voip/shared';

// Validation Error Handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array().map(error => ({
          field: error.type === 'field' ? error.path : 'unknown',
          message: error.msg,
          value: error.type === 'field' ? error.value : undefined
        }))
      }
    });
  }
  
  next();
};

// Generic Zod validator for body/query/params
export function validateRequest(schema: ZodSchema<any>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: parsed.error.errors.map(e => ({
              field: e.path?.join('.') || 'unknown',
              message: e.message
            }))
          }
        });
      }
      // assign parsed data back to request to ensure types/values
      if (source === 'body') req.body = parsed.data;
      if (source === 'query') req.query = parsed.data;
      if (source === 'params') req.params = parsed.data as any;
      next();
    } catch (err) {
      return res.status(500).json({ success: false, error: { code: 'VALIDATION_MIDDLEWARE_ERROR', message: 'Unexpected validation error' } });
    }
  };
}

// UUID Validation
export const validateUUID = (field: string) => {
  return param(field).isUUID().withMessage(`${field} must be a valid UUID`);
};

// Tenant Validation
export const validateTenant = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .trim(),
  body('domain')
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/)
    .withMessage('Domain must contain only alphanumeric characters and hyphens, cannot start or end with hyphen')
    .isLength({ min: 3, max: 100 })
    .withMessage('Domain must be between 3 and 100 characters'),
  body('sip_domain')
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/)
    .withMessage('SIP domain must be a valid domain name')
    .isLength({ min: 3, max: 100 })
    .withMessage('SIP domain must be between 3 and 100 characters'),
  body('status')
    .optional()
    .isIn(['active', 'suspended', 'pending'])
    .withMessage('Status must be active, suspended, or pending'),
  body('settings.max_concurrent_calls')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max concurrent calls must be between 1 and 1000'),
  body('settings.recording_enabled')
    .optional()
    .isBoolean()
    .withMessage('Recording enabled must be a boolean'),
  body('settings.gdpr_compliant')
    .optional()
    .isBoolean()
    .withMessage('GDPR compliant must be a boolean'),
  body('settings.timezone')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Timezone must be between 1 and 50 characters'),
  body('settings.language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language must be between 2 and 5 characters')
];

// Store Validation
export const validateStore = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .trim(),
  body('store_id')
    .isLength({ min: 1, max: 50 })
    .withMessage('Store ID must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Store ID can only contain alphanumeric characters, hyphens, and underscores'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  body('settings.business_hours.enabled')
    .optional()
    .isBoolean()
    .withMessage('Business hours enabled must be a boolean'),
  body('settings.business_hours.timezone')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Business hours timezone must be between 1 and 50 characters'),
  body('settings.outbound_caller_id')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Outbound caller ID must be a valid E.164 number'),
  body('settings.recording_consent_required')
    .optional()
    .isBoolean()
    .withMessage('Recording consent required must be a boolean')
];

// Extension Validation
export const validateExtension = [
  body('extension')
    .matches(/^[0-9]{3,6}$/)
    .withMessage('Extension must be 3-6 digits'),
  body('password')
    .isLength({ min: 8, max: 32 })
    .withMessage('Password must be between 8 and 32 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('display_name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1 and 100 characters')
    .trim(),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'locked'])
    .withMessage('Status must be active, inactive, or locked'),
  body('type')
    .optional()
    .isIn(['user', 'queue', 'conference', 'voicemail'])
    .withMessage('Type must be user, queue, conference, or voicemail'),
  body('settings.voicemail_enabled')
    .optional()
    .isBoolean()
    .withMessage('Voicemail enabled must be a boolean'),
  body('settings.call_forwarding.enabled')
    .optional()
    .isBoolean()
    .withMessage('Call forwarding enabled must be a boolean'),
  body('settings.call_forwarding.destination')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$|^[0-9]{3,6}$/)
    .withMessage('Call forwarding destination must be a valid E.164 number or extension'),
  body('settings.dnd_enabled')
    .optional()
    .isBoolean()
    .withMessage('DND enabled must be a boolean'),
  body('settings.recording_enabled')
    .optional()
    .isBoolean()
    .withMessage('Recording enabled must be a boolean')
];

// SIP Trunk Validation
export const validateSipTrunk = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .trim(),
  body('provider')
    .isLength({ min: 1, max: 100 })
    .withMessage('Provider must be between 1 and 100 characters')
    .trim(),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'testing'])
    .withMessage('Status must be active, inactive, or testing'),
  body('sip_config.host')
    .isLength({ min: 1, max: 255 })
    .withMessage('SIP host must be between 1 and 255 characters'),
  body('sip_config.port')
    .isInt({ min: 1, max: 65535 })
    .withMessage('SIP port must be between 1 and 65535'),
  body('sip_config.transport')
    .isIn(['udp', 'tcp', 'tls'])
    .withMessage('SIP transport must be udp, tcp, or tls'),
  body('sip_config.username')
    .isLength({ min: 1, max: 100 })
    .withMessage('SIP username must be between 1 and 100 characters'),
  body('sip_config.password')
    .isLength({ min: 1, max: 100 })
    .withMessage('SIP password must be between 1 and 100 characters'),
  body('did_config.number')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('DID number must be a valid E.164 number'),
  body('did_config.country_code')
    .isLength({ min: 2, max: 2 })
    .withMessage('Country code must be exactly 2 characters'),
  body('did_config.local_number')
    .isLength({ min: 1, max: 20 })
    .withMessage('Local number must be between 1 and 20 characters'),
  body('security.encryption')
    .optional()
    .isIn(['none', 'tls', 'srtp'])
    .withMessage('Encryption must be none, tls, or srtp'),
  body('security.authentication')
    .optional()
    .isIn(['none', 'digest', 'tls'])
    .withMessage('Authentication must be none, digest, or tls'),
  body('gdpr.data_retention_days')
    .optional()
    .isInt({ min: 30, max: 2555 })
    .withMessage('Data retention days must be between 30 and 2555'),
  body('gdpr.recording_consent_required')
    .optional()
    .isBoolean()
    .withMessage('Recording consent required must be a boolean'),
  body('gdpr.data_controller')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Data controller must be between 1 and 200 characters'),
  body('gdpr.dpo_contact')
    .optional()
    .isEmail()
    .withMessage('DPO contact must be a valid email address')
];

// Trunk Registration Validation (for UI form)
export const validateTrunkRegistration = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome trunk richiesto (1-100 caratteri)')
    .trim(),
  body('provider')
    .isLength({ min: 1, max: 100 })
    .withMessage('Provider richiesto (1-100 caratteri)')
    .trim(),
  body('host')
    .isLength({ min: 1, max: 255 })
    .withMessage('Host SIP richiesto (1-255 caratteri)'),
  body('port')
    .isInt({ min: 1, max: 65535 })
    .withMessage('Porta SIP deve essere tra 1 e 65535'),
  body('transport')
    .isIn(['udp', 'tcp', 'tls'])
    .withMessage('Trasporto deve essere udp, tcp o tls'),
  body('username')
    .isLength({ min: 1, max: 100 })
    .withMessage('Username SIP richiesto (1-100 caratteri)'),
  body('password')
    .isLength({ min: 1, max: 100 })
    .withMessage('Password SIP richiesta (1-100 caratteri)'),
  body('number')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Formato numero non valido (E.164)'),
  body('country_code')
    .isLength({ min: 2, max: 2 })
    .withMessage('Codice paese richiesto (2 caratteri)'),
  body('local_number')
    .isLength({ min: 1, max: 20 })
    .withMessage('Numero locale richiesto (1-20 caratteri)'),
  body('encryption')
    .isIn(['none', 'tls', 'srtp'])
    .withMessage('Crittografia deve essere none, tls o srtp'),
  body('authentication')
    .isIn(['none', 'digest', 'tls'])
    .withMessage('Autenticazione deve essere none, digest o tls'),
  body('data_retention_days')
    .isInt({ min: 30, max: 2555 })
    .withMessage('Conservazione dati deve essere tra 30 e 2555 giorni'),
  body('recording_consent_required')
    .isBoolean()
    .withMessage('Consenso registrazione deve essere true o false'),
  body('data_controller')
    .isLength({ min: 1, max: 200 })
    .withMessage('Titolare del trattamento richiesto (1-200 caratteri)'),
  body('dpo_contact')
    .optional()
    .isEmail()
    .withMessage('Email DPO non valida'),
  body('gdpr_consent')
    .isBoolean()
    .custom((value) => {
      if (!value) {
        throw new Error('Consenso GDPR richiesto');
      }
      return true;
    }),
  body('terms_accepted')
    .isBoolean()
    .custom((value) => {
      if (!value) {
        throw new Error('Termini e condizioni richiesti');
      }
      return true;
    })
];

// CDR Filter Validation
export const validateCDRFilter = [
  query('tenant_id')
    .optional()
    .isUUID()
    .withMessage('Tenant ID must be a valid UUID'),
  query('store_id')
    .optional()
    .isUUID()
    .withMessage('Store ID must be a valid UUID'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('call_direction')
    .optional()
    .isIn(['inbound', 'outbound', 'internal'])
    .withMessage('Call direction must be inbound, outbound, or internal'),
  query('call_type')
    .optional()
    .isIn(['voice', 'video', 'fax'])
    .withMessage('Call type must be voice, video, or fax'),
  query('hangup_disposition')
    .optional()
    .isIn(['answered', 'busy', 'no_answer', 'congestion', 'fail', 'timeout'])
    .withMessage('Hangup disposition must be answered, busy, no_answer, congestion, fail, or timeout'),
  query('min_duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min duration must be a non-negative integer'),
  query('max_duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max duration must be a non-negative integer'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('sort_by')
    .optional()
    .isIn(['start_time', 'duration', 'caller_number', 'callee_number'])
    .withMessage('Sort by must be start_time, duration, caller_number, or callee_number'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Pagination Validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
];

// Search Validation
export const validateSearch = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim()
];

