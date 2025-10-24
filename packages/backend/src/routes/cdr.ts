// @ts-nocheck
import { Router } from 'express';
import { z } from 'zod';
import { CDRService } from '../services/cdr.service';
import { authenticateToken } from '../middleware/auth';
import { setTenantContext } from '../middleware/tenant';
import { validateRequest } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
// Removed unused import: logAPICall

const router = Router();
const cdrService = new CDRService();

// Validation schemas
const cdrFilterSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  store_id: z.string().uuid().optional(),
  extension_id: z.string().uuid().optional(),
  trunk_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  call_direction: z.enum(['inbound', 'outbound', 'internal']).optional(),
  call_type: z.enum(['voice', 'video', 'fax']).optional(),
  hangup_disposition: z.enum(['answered', 'no_answer', 'busy', 'failed', 'unknown']).optional(),
  caller_number: z.string().optional(),
  callee_number: z.string().optional(),
  min_duration: z.number().min(0).optional(),
  max_duration: z.number().min(0).optional(),
  recording_enabled: z.boolean().optional(),
  recording_consent: z.boolean().optional(),
  min_mos: z.number().min(1).max(5).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort_by: z.enum(['start_time', 'duration', 'caller_number', 'callee_number']).default('start_time'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

const cdrStatsSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  store_id: z.string().uuid().optional(),
  extension_id: z.string().uuid().optional(),
  trunk_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  call_direction: z.enum(['inbound', 'outbound', 'internal']).optional(),
  call_type: z.enum(['voice', 'video', 'fax']).optional(),
  hangup_disposition: z.enum(['answered', 'no_answer', 'busy', 'failed', 'unknown']).optional()
});

const updateCDRSchema = z.object({
  answer_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  duration: z.number().min(0).optional(),
  bill_seconds: z.number().min(0).optional(),
  hangup_cause: z.string().optional(),
  hangup_disposition: z.enum(['answered', 'no_answer', 'busy', 'failed', 'unknown']).optional(),
  audio_codec: z.string().optional(),
  video_codec: z.string().optional(),
  rtp_audio_in_mos: z.number().min(1).max(5).optional(),
  rtp_audio_out_mos: z.number().min(1).max(5).optional(),
  recording_enabled: z.boolean().optional(),
  recording_path: z.string().optional(),
  recording_duration: z.number().min(0).optional(),
  recording_consent: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional()
});

const anonymizeCDRSchema = z.object({
  cdr_id: z.string().uuid('Invalid CDR ID')
});

const deleteCDRSchema = z.object({
  cdr_id: z.string().uuid('Invalid CDR ID')
});

// List CDR records
router.get('/',
  authenticateToken,
  setTenantContext,
  validateRequest(cdrFilterSchema, 'query'),
  async (req, res) => {
    try {
      const filter = req.query;
      const tenantId = req.tenantId!;

        tenant_id: tenantId, 
        filter: Object.keys(filter) 
      });

      // Ensure tenant_id is set from context
      const cdrFilter = {
        ...filter,
        tenant_id: tenantId
      };

      const result = await cdrService.listCDR(cdrFilter);

      successResponse(res, {
        cdr: result.cdr,
        pagination: {
          page: parseInt(filter.page as string) || 1,
          limit: parseInt(filter.limit as string) || 20,
          total: result.total,
          total_pages: result.totalPages
        }
      });

    } catch (error) {
      console.error('Error listing CDR:', error);
      errorResponse(res, 'Failed to list CDR records', 500);
    }
  }
);

// Get CDR statistics
router.get('/stats',
  authenticateToken,
  setTenantContext,
  validateRequest(cdrStatsSchema, 'query'),
  async (req, res) => {
    try {
      const filter = req.query;
      const tenantId = req.tenantId!;

        tenant_id: tenantId, 
        filter: Object.keys(filter) 
      });

      // Ensure tenant_id is set from context
      const statsFilter = {
        ...filter,
        tenant_id: tenantId
      };

      const stats = await cdrService.getCDRStats(statsFilter);

      successResponse(res, stats);

    } catch (error) {
      console.error('Error getting CDR stats:', error);
      errorResponse(res, 'Failed to get CDR statistics', 500);
    }
  }
);

// Get CDR by ID
router.get('/:cdr_id',
  authenticateToken,
  setTenantContext,
  async (req, res) => {
    try {
      const { cdr_id } = req.params;
      const tenantId = req.tenantId!;

        tenant_id: tenantId, 
        cdr_id 
      });

      const cdr = await cdrService.getCDRById(cdr_id, tenantId);

      if (!cdr) {
        return errorResponse(res, 'CDR not found', 404);
      }

      successResponse(res, cdr);

    } catch (error) {
      console.error('Error getting CDR:', error);
      errorResponse(res, 'Failed to get CDR', 500);
    }
  }
);

// Update CDR record
router.patch('/:cdr_id',
  authenticateToken,
  setTenantContext,
  validateRequest(updateCDRSchema),
  async (req, res) => {
    try {
      const { cdr_id } = req.params;
      const updates = req.body;
      const tenantId = req.tenantId!;

        tenant_id: tenantId, 
        cdr_id, 
        updates: Object.keys(updates) 
      });

      const cdr = await cdrService.updateCDR(cdr_id, updates, tenantId);

      successResponse(res, cdr);

    } catch (error) {
      console.error('Error updating CDR:', error);
      if (error.message === 'CDR not found') {
        return errorResponse(res, 'CDR not found', 404);
      }
      errorResponse(res, 'Failed to update CDR', 500);
    }
  }
);

// Anonymize CDR record (GDPR compliance)
router.post('/:cdr_id/anonymize',
  authenticateToken,
  setTenantContext,
  async (req, res) => {
    try {
      const { cdr_id } = req.params;
      const tenantId = req.tenantId!;

        tenant_id: tenantId, 
        cdr_id 
      });

      await cdrService.anonymizeCDR(cdr_id, tenantId);

      successResponse(res, {
        cdr_id,
        status: 'anonymized',
        message: 'CDR record has been anonymized for GDPR compliance'
      });

    } catch (error) {
      console.error('Error anonymizing CDR:', error);
      if (error.message === 'CDR not found') {
        return errorResponse(res, 'CDR not found', 404);
      }
      errorResponse(res, 'Failed to anonymize CDR', 500);
    }
  }
);

// Delete CDR record (GDPR compliance)
router.delete('/:cdr_id',
  authenticateToken,
  setTenantContext,
  async (req, res) => {
    try {
      const { cdr_id } = req.params;
      const tenantId = req.tenantId!;

        tenant_id: tenantId, 
        cdr_id 
      });

      await cdrService.deleteCDR(cdr_id, tenantId);

      successResponse(res, {
        cdr_id,
        status: 'deleted',
        message: 'CDR record has been deleted for GDPR compliance'
      });

    } catch (error) {
      console.error('Error deleting CDR:', error);
      if (error.message === 'CDR not found') {
        return errorResponse(res, 'CDR not found', 404);
      }
      errorResponse(res, 'Failed to delete CDR', 500);
    }
  }
);

// Export CDR records (CSV format)
router.get('/export/csv',
  authenticateToken,
  setTenantContext,
  validateRequest(cdrFilterSchema, 'query'),
  async (req, res) => {
    try {
      const filter = req.query;
      const tenantId = req.tenantId!;

        tenant_id: tenantId, 
        filter: Object.keys(filter) 
      });

      // Ensure tenant_id is set from context
      const cdrFilter = {
        ...filter,
        tenant_id: tenantId,
        limit: 10000 // Large limit for export
      };

      const result = await cdrService.listCDR(cdrFilter);

      // Generate CSV
      const csvHeaders = [
        'ID',
        'Call UUID',
        'Start Time',
        'Answer Time',
        'End Time',
        'Duration (s)',
        'Bill Seconds',
        'Call Direction',
        'Call Type',
        'Caller Number',
        'Caller Name',
        'Caller Extension',
        'Callee Number',
        'Callee Name',
        'Callee Extension',
        'Hangup Cause',
        'Hangup Disposition',
        'Audio Codec',
        'Video Codec',
        'MOS Score',
        'Recording Enabled',
        'Recording Path',
        'Recording Duration',
        'Recording Consent',
        'Local IP',
        'Remote IP',
        'Created At'
      ];

      const csvRows = result.cdr.map(cdr => [
        cdr.id,
        cdr.call_uuid,
        cdr.start_time?.toISOString() || '',
        cdr.answer_time?.toISOString() || '',
        cdr.end_time?.toISOString() || '',
        cdr.duration || 0,
        cdr.bill_seconds || 0,
        cdr.call_direction,
        cdr.call_type,
        cdr.caller_id_number || '',
        cdr.caller_id_name || '',
        cdr.caller_extension || '',
        cdr.callee_id_number || '',
        cdr.callee_id_name || '',
        cdr.callee_extension || '',
        cdr.hangup_cause || '',
        cdr.hangup_disposition,
        cdr.audio_codec || '',
        cdr.video_codec || '',
        cdr.rtp_audio_in_mos || cdr.rtp_audio_out_mos || '',
        cdr.recording_enabled ? 'Yes' : 'No',
        cdr.recording_path || '',
        cdr.recording_duration || 0,
        cdr.recording_consent ? 'Yes' : 'No',
        cdr.local_ip || '',
        cdr.remote_ip || '',
        cdr.created_at?.toISOString() || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Set response headers for CSV download
      const filename = `cdr_export_${tenantId}_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(csvContent));

      res.send(csvContent);

    } catch (error) {
      console.error('Error exporting CDR CSV:', error);
      errorResponse(res, 'Failed to export CDR records', 500);
    }
  }
);

// Export CDR records (JSON format)
router.get('/export/json',
  authenticateToken,
  setTenantContext,
  validateRequest(cdrFilterSchema, 'query'),
  async (req, res) => {
    try {
      const filter = req.query;
      const tenantId = req.tenantId!;

        tenant_id: tenantId, 
        filter: Object.keys(filter) 
      });

      // Ensure tenant_id is set from context
      const cdrFilter = {
        ...filter,
        tenant_id: tenantId,
        limit: 10000 // Large limit for export
      };

      const result = await cdrService.listCDR(cdrFilter);

      // Set response headers for JSON download
      const filename = `cdr_export_${tenantId}_${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      successResponse(res, {
        export_info: {
          tenant_id: tenantId,
          export_date: new Date().toISOString(),
          total_records: result.total,
          filters_applied: filter
        },
        cdr_records: result.cdr
      });

    } catch (error) {
      console.error('Error exporting CDR JSON:', error);
      errorResponse(res, 'Failed to export CDR records', 500);
    }
  }
);

// Bulk operations for GDPR compliance
router.post('/bulk/anonymize',
  authenticateToken,
  setTenantContext,
  async (req, res) => {
    try {
      const { cdr_ids } = req.body;
      const tenantId = req.tenantId!;

      if (!Array.isArray(cdr_ids) || cdr_ids.length === 0) {
        return errorResponse(res, 'CDR IDs array is required', 400);
      }

        tenant_id: tenantId, 
        count: cdr_ids.length 
      });

      const results = [];
      const errors = [];

      for (const cdrId of cdr_ids) {
        try {
          await cdrService.anonymizeCDR(cdrId, tenantId);
          results.push({ cdr_id: cdrId, status: 'anonymized' });
        } catch (error) {
          errors.push({ cdr_id: cdrId, error: error.message });
        }
      }

      successResponse(res, {
        total_processed: cdr_ids.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      });

    } catch (error) {
      console.error('Error bulk anonymizing CDR:', error);
      errorResponse(res, 'Failed to bulk anonymize CDR records', 500);
    }
  }
);

router.post('/bulk/delete',
  authenticateToken,
  setTenantContext,
  async (req, res) => {
    try {
      const { cdr_ids } = req.body;
      const tenantId = req.tenantId!;

      if (!Array.isArray(cdr_ids) || cdr_ids.length === 0) {
        return errorResponse(res, 'CDR IDs array is required', 400);
      }

        tenant_id: tenantId, 
        count: cdr_ids.length 
      });

      const results = [];
      const errors = [];

      for (const cdrId of cdr_ids) {
        try {
          await cdrService.deleteCDR(cdrId, tenantId);
          results.push({ cdr_id: cdrId, status: 'deleted' });
        } catch (error) {
          errors.push({ cdr_id: cdrId, error: error.message });
        }
      }

      successResponse(res, {
        total_processed: cdr_ids.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      });

    } catch (error) {
      console.error('Error bulk deleting CDR:', error);
      errorResponse(res, 'Failed to bulk delete CDR records', 500);
    }
  }
);

export default router;

