"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const extension_service_1 = require("../services/extension.service");
const middleware_1 = require("../middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
const extensionService = new extension_service_1.ExtensionService();
// Apply authentication and tenant context to all routes
router.use(middleware_1.authenticateToken);
router.use(middleware_1.requireTenant);
router.use(middleware_1.setTenantContext);
// Create extension
router.post('/', middleware_1.validateExtension, middleware_1.handleValidationErrors, (0, response_1.asyncHandler)(async (req, res) => {
    const extensionData = {
        ...req.body,
        tenant_id: req.tenantId,
        store_id: req.body.store_id || null
    };
    const extension = await extensionService.createExtension(extensionData);
    (0, response_1.createdResponse)(res, extension, 'Extension created successfully');
}));
// List extensions for tenant
router.get('/', middleware_1.validatePagination, middleware_1.handleValidationErrors, (0, response_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.q;
    const storeId = req.query.store_id;
    const result = await extensionService.listExtensions(req.tenantId, storeId, page, limit, search);
    (0, response_1.paginatedResponse)(res, result.extensions, {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages
    }, 'Extensions retrieved successfully');
}));
// Get extension by ID
router.get('/:id', (0, response_1.asyncHandler)(async (req, res) => {
    const extensionId = req.params.id;
    const extension = await extensionService.getExtensionById(extensionId, req.tenantId);
    if (!extension) {
        return (0, response_1.notFoundResponse)(res, 'Extension not found');
    }
    (0, response_1.successResponse)(res, extension, 'Extension retrieved successfully');
}));
// Get extension by number
router.get('/number/:extension', (0, response_1.asyncHandler)(async (req, res) => {
    const extension = req.params.extension;
    const ext = await extensionService.getExtensionByNumber(extension, req.tenantId);
    if (!ext) {
        return (0, response_1.notFoundResponse)(res, 'Extension not found');
    }
    (0, response_1.successResponse)(res, ext, 'Extension retrieved successfully');
}));
// Update extension
router.put('/:id', middleware_1.validateExtension, middleware_1.handleValidationErrors, (0, response_1.asyncHandler)(async (req, res) => {
    const extensionId = req.params.id;
    const extension = await extensionService.updateExtension(extensionId, req.body, req.tenantId);
    (0, response_1.updatedResponse)(res, extension, 'Extension updated successfully');
}));
// Delete extension
router.delete('/:id', (0, response_1.asyncHandler)(async (req, res) => {
    const extensionId = req.params.id;
    await extensionService.deleteExtension(extensionId, req.tenantId);
    (0, response_1.deletedResponse)(res, 'Extension deleted successfully');
}));
// Verify extension password (for authentication)
router.post('/verify-password', (0, response_1.asyncHandler)(async (req, res) => {
    const { extension, password } = req.body;
    if (!extension || !password) {
        return (0, response_1.errorResponse)(res, 'Extension and password are required', 400, 'MISSING_FIELDS');
    }
    const ext = await extensionService.verifyExtensionPassword(extension, password, req.tenantId);
    if (!ext) {
        return (0, response_1.errorResponse)(res, 'Invalid extension or password', 401, 'INVALID_CREDENTIALS');
    }
    (0, response_1.successResponse)(res, ext, 'Extension authenticated successfully');
}));
// Get extension registration status from FreeSWITCH
router.get('/:id/status', (0, response_1.asyncHandler)(async (req, res) => {
    const extensionId = req.params.id;
    const status = await extensionService.getExtensionStatus(extensionId, req.tenantId);
    (0, response_1.successResponse)(res, status, 'Extension status retrieved successfully');
}));
// Get extension statistics
router.get('/:id/stats', (0, response_1.asyncHandler)(async (req, res) => {
    const extensionId = req.params.id;
    const stats = await extensionService.getExtensionStats(extensionId, req.tenantId);
    (0, response_1.successResponse)(res, stats, 'Extension statistics retrieved successfully');
}));
// Activate extension
router.post('/:id/activate', (0, response_1.asyncHandler)(async (req, res) => {
    const extensionId = req.params.id;
    const extension = await extensionService.activateExtension(extensionId, req.tenantId);
    (0, response_1.updatedResponse)(res, extension, 'Extension activated successfully');
}));
// Deactivate extension
router.post('/:id/deactivate', (0, response_1.asyncHandler)(async (req, res) => {
    const extensionId = req.params.id;
    const extension = await extensionService.deactivateExtension(extensionId, req.tenantId);
    (0, response_1.updatedResponse)(res, extension, 'Extension deactivated successfully');
}));
// Lock extension
router.post('/:id/lock', (0, response_1.asyncHandler)(async (req, res) => {
    const extensionId = req.params.id;
    const extension = await extensionService.lockExtension(extensionId, req.tenantId);
    (0, response_1.updatedResponse)(res, extension, 'Extension locked successfully');
}));
// Validate extension number uniqueness within tenant
router.post('/validate-extension', (0, response_1.asyncHandler)(async (req, res) => {
    const { extension, exclude_extension_id } = req.body;
    if (!extension) {
        return (0, response_1.errorResponse)(res, 'Extension number is required', 400, 'MISSING_FIELDS');
    }
    const isUnique = await extensionService.validateExtensionUniqueness(extension, req.tenantId, exclude_extension_id);
    (0, response_1.successResponse)(res, { is_unique: isUnique }, 'Extension validation completed');
}));
// Get extensions by store
router.get('/store/:storeId', middleware_1.setStoreContext, middleware_1.validatePagination, middleware_1.handleValidationErrors, (0, response_1.asyncHandler)(async (req, res) => {
    const storeId = req.params.storeId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.q;
    const result = await extensionService.listExtensions(req.tenantId, storeId, page, limit, search);
    (0, response_1.paginatedResponse)(res, result.extensions, {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages
    }, 'Store extensions retrieved successfully');
}));
exports.default = router;
//# sourceMappingURL=extensions.js.map