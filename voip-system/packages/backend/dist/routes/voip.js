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
// List SIP Extensions for tenant
router.get('/sip-extensions', middleware_1.validatePagination, middleware_1.handleValidationErrors, (0, response_1.asyncHandler)(async (req, res) => {
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
    }, 'SIP Extensions retrieved successfully');
}));
// Get SIP Extension by ID
router.get('/sip-extensions/:id', (0, response_1.asyncHandler)(async (req, res) => {
    const extensionId = req.params.id;
    const extension = await extensionService.getExtensionById(extensionId, req.tenantId);
    if (!extension) {
        return (0, response_1.notFoundResponse)(res, 'SIP Extension not found');
    }
    (0, response_1.successResponse)(res, extension, 'SIP Extension retrieved successfully');
}));
// Get SIP Extension by number
router.get('/sip-extensions/number/:extension', (0, response_1.asyncHandler)(async (req, res) => {
    const extensionNumber = req.params.extension;
    const extension = await extensionService.getExtensionByNumber(extensionNumber, req.tenantId);
    if (!extension) {
        return (0, response_1.notFoundResponse)(res, 'SIP Extension not found');
    }
    (0, response_1.successResponse)(res, extension, 'SIP Extension retrieved successfully');
}));
exports.default = router;
//# sourceMappingURL=voip.js.map