import { Router } from 'express';
import { authenticateToken, requireTenant, setTenantContext } from '../middleware';
import { successResponse, errorResponse, asyncHandler } from '../utils/response';
import { getClient } from '@w3-voip/database';

const router = Router();

// Apply authentication and tenant context to all routes
router.use(authenticateToken);
router.use(requireTenant);
router.use(setTenantContext);

// Get SIP trunks for tenant
router.get('/', asyncHandler(async (req, res) => {
  const client = await getClient();
  
  try {
    const result = await client.query(
      `SELECT 
        id, 
        tenant_id, 
        name, 
        provider, 
        status,
        provider_config,
        sip_config,
        created_at,
        updated_at
      FROM sip_trunks 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC`,
      [req.tenantId]
    );
    
    successResponse(res, result.rows, 'SIP trunks retrieved successfully');
  } catch (error) {
    console.error('Error fetching SIP trunks:', error);
    errorResponse(res, 'Failed to fetch SIP trunks', 500);
  } finally {
    await client.release();
  }
}));

// Get SIP trunk status
router.get('/:id/status', asyncHandler(async (req, res) => {
  const trunkId = req.params.id;
  const client = await getClient();
  
  try {
    const result = await client.query(
      `SELECT 
        id, 
        name, 
        status,
        last_successful_registration,
        current_calls,
        max_concurrent_calls
      FROM sip_trunks 
      WHERE id = $1 AND tenant_id = $2`,
      [trunkId, req.tenantId]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'SIP trunk not found', 404);
    }
    
    const trunk = result.rows[0];
    const status = {
      id: trunk.id,
      name: trunk.name,
      status: trunk.status,
      last_registration: trunk.last_successful_registration,
      calls_in: trunk.current_calls || 0,
      calls_out: 0,
      failed_calls: 0
    };
    
    successResponse(res, status, 'SIP trunk status retrieved successfully');
  } catch (error) {
    console.error('Error fetching SIP trunk status:', error);
    errorResponse(res, 'Failed to fetch SIP trunk status', 500);
  } finally {
    await client.release();
  }
}));

export default router;
