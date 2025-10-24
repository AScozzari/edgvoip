import { Router } from 'express';
import { authenticateToken, requireTenant, setTenantContext } from '../middleware';
import { successResponse, errorResponse, asyncHandler } from '../utils/response';

const router = Router();

// Apply authentication and tenant context to all routes
router.use(authenticateToken);
router.use(requireTenant);
router.use(setTenantContext);

// Get SIP trunks for tenant
router.get('/', asyncHandler(async (req, res) => {
  try {
    // For now, return the MessageNet trunk configuration
    // In a real implementation, this would come from the database
    const trunks = [
      {
        id: 'messagenet',
        name: 'MessageNet',
        provider: 'MessageNet',
        host: 'sip.messagenet.it',
        port: 5060,
        username: '5406594427',
        status: 'registered',
        type: 'sip',
        tenant_id: req.tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    successResponse(res, trunks, 'SIP trunks retrieved successfully');
  } catch (error) {
    console.error('Error fetching SIP trunks:', error);
    errorResponse(res, 'Failed to fetch SIP trunks', 500);
  }
}));

// Get SIP trunk status
router.get('/:id/status', asyncHandler(async (req, res) => {
  const trunkId = req.params.id;
  
  try {
    // For MessageNet trunk, return the status from FreeSWITCH
    if (trunkId === 'messagenet') {
      // This would normally query FreeSWITCH ESL for real status
      const status = {
        id: trunkId,
        name: 'MessageNet',
        status: 'registered',
        last_registration: new Date().toISOString(),
        calls_in: 0,
        calls_out: 0,
        failed_calls: 0
      };
      
      successResponse(res, status, 'SIP trunk status retrieved successfully');
    } else {
      errorResponse(res, 'SIP trunk not found', 404);
    }
  } catch (error) {
    console.error('Error fetching SIP trunk status:', error);
    errorResponse(res, 'Failed to fetch SIP trunk status', 500);
  }
}));

export default router;