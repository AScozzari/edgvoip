"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const freeswitch_deploy_service_1 = require("../services/freeswitch-deploy.service");
const auth_1 = require("../middleware/auth");
const tenant_auth_1 = require("../middleware/tenant-auth");
const response_1 = require("../utils/response");
const router = express_1.default.Router();
const deployService = new freeswitch_deploy_service_1.FreeSWITCHDeployService();
// Apply authentication to all routes
router.use(auth_1.authenticateToken);
/**
 * POST /api/freeswitch/deploy/tenant/:tenantId
 * Deploy complete tenant configuration (contexts, extensions, trunks)
 */
router.post('/tenant/:tenantId', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const { tenantId } = req.params;
    const result = await deployService.deployTenantConfig(tenantId);
    (0, response_1.successResponse)(res, result, 'Tenant configuration deployed successfully');
}));
/**
 * POST /api/freeswitch/deploy/extension/:extensionId
 * Deploy single extension configuration
 */
router.post('/extension/:extensionId', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const { extensionId } = req.params;
    const result = await deployService.deployExtension(extensionId);
    (0, response_1.successResponse)(res, result, 'Extension deployed successfully');
}));
/**
 * POST /api/freeswitch/deploy/trunk/:trunkId
 * Deploy single trunk configuration
 */
router.post('/trunk/:trunkId', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const { trunkId } = req.params;
    const result = await deployService.deployTrunk(trunkId);
    (0, response_1.successResponse)(res, result, 'Trunk deployed successfully');
}));
/**
 * POST /api/freeswitch/deploy/reload
 * Reload FreeSWITCH configuration globally
 */
router.post('/reload', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    await deployService.reloadFreeSWITCH();
    (0, response_1.successResponse)(res, { reloaded: true }, 'FreeSWITCH configuration reloaded');
}));
/**
 * POST /api/freeswitch/deploy/backup/:tenantId
 * Create backup of tenant configuration
 */
router.post('/backup/:tenantId', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const { tenantId } = req.params;
    const backupPath = await deployService.createConfigBackup(tenantId);
    (0, response_1.successResponse)(res, { backup_path: backupPath }, 'Configuration backup created');
}));
/**
 * POST /api/freeswitch/deploy/rollback/:tenantId
 * Rollback tenant configuration to previous backup
 */
router.post('/rollback/:tenantId', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const { tenantId } = req.params;
    const { backup_path } = req.body;
    if (!backup_path) {
        return (0, response_1.errorResponse)(res, 'backup_path is required', 400);
    }
    await deployService.rollbackConfig(tenantId, backup_path);
    (0, response_1.successResponse)(res, { rolled_back: true }, 'Configuration rolled back successfully');
}));
exports.default = router;
//# sourceMappingURL=freeswitch-deploy.routes.js.map