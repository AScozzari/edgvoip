import express from 'express';
import { FreeSWITCHDeployService } from '../services/freeswitch-deploy.service';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireTenantOwnerOrMaster } from '../middleware/tenant-auth';
import { asyncHandler, successResponse, errorResponse } from '../utils/response';

const router = express.Router();
const deployService = new FreeSWITCHDeployService();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * POST /api/freeswitch/deploy/tenant/:tenantId
 * Deploy complete tenant configuration (contexts, extensions, trunks)
 */
router.post(
  '/tenant/:tenantId',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const { tenantId } = req.params;

    const result = await deployService.deployTenantConfig(tenantId);

    successResponse(res, result, 'Tenant configuration deployed successfully');
  })
);

/**
 * POST /api/freeswitch/deploy/extension/:extensionId
 * Deploy single extension configuration
 */
router.post(
  '/extension/:extensionId',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const { extensionId } = req.params;

    const result = await deployService.deployExtension(extensionId);

    successResponse(res, result, 'Extension deployed successfully');
  })
);

/**
 * POST /api/freeswitch/deploy/trunk/:trunkId
 * Deploy single trunk configuration
 */
router.post(
  '/trunk/:trunkId',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const { trunkId } = req.params;

    const result = await deployService.deployTrunk(trunkId);

    successResponse(res, result, 'Trunk deployed successfully');
  })
);

/**
 * POST /api/freeswitch/deploy/reload
 * Reload FreeSWITCH configuration globally
 */
router.post(
  '/reload',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    await deployService.reloadFreeSWITCH();

    successResponse(res, { reloaded: true }, 'FreeSWITCH configuration reloaded');
  })
);

/**
 * POST /api/freeswitch/deploy/backup/:tenantId
 * Create backup of tenant configuration
 */
router.post(
  '/backup/:tenantId',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const { tenantId } = req.params;

    const backupPath = await deployService.createConfigBackup(tenantId);

    successResponse(res, { backup_path: backupPath }, 'Configuration backup created');
  })
);

/**
 * POST /api/freeswitch/deploy/rollback/:tenantId
 * Rollback tenant configuration to previous backup
 */
router.post(
  '/rollback/:tenantId',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const { tenantId } = req.params;
    const { backup_path } = req.body;

    if (!backup_path) {
      return errorResponse(res, 'backup_path is required', 400);
    }

    await deployService.rollbackConfig(tenantId, backup_path);

    successResponse(res, { rolled_back: true }, 'Configuration rolled back successfully');
  })
);

export default router;

