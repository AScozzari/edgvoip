"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const store_service_1 = require("../services/store.service");
const middleware_1 = require("../middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
const storeService = new store_service_1.StoreService();
// Apply authentication and tenant context to all routes
router.use(middleware_1.authenticateToken);
router.use(middleware_1.requireTenant);
router.use(middleware_1.setTenantContext);
// Create store
router.post('/', middleware_1.validateStore, middleware_1.handleValidationErrors, (0, response_1.asyncHandler)(async (req, res) => {
    const storeData = {
        ...req.body,
        tenant_id: req.tenantId
    };
    const store = await storeService.createStore(storeData);
    (0, response_1.createdResponse)(res, store, 'Store created successfully');
}));
// List stores for tenant
router.get('/', middleware_1.validatePagination, middleware_1.handleValidationErrors, (0, response_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.q;
    const result = await storeService.listStores(req.tenantId, page, limit, search);
    (0, response_1.paginatedResponse)(res, result.stores, {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages
    }, 'Stores retrieved successfully');
}));
// Get store by ID
router.get('/:id', middleware_1.setStoreContext, (0, response_1.asyncHandler)(async (req, res) => {
    const storeId = req.params.id;
    const store = await storeService.getStoreById(storeId, req.tenantId);
    if (!store) {
        return (0, response_1.notFoundResponse)(res, 'Store not found');
    }
    (0, response_1.successResponse)(res, store, 'Store retrieved successfully');
}));
// Update store
router.put('/:id', middleware_1.setStoreContext, middleware_1.validateStore, middleware_1.handleValidationErrors, (0, response_1.asyncHandler)(async (req, res) => {
    const storeId = req.params.id;
    const store = await storeService.updateStore(storeId, req.body, req.tenantId);
    (0, response_1.updatedResponse)(res, store, 'Store updated successfully');
}));
// Delete store
router.delete('/:id', middleware_1.setStoreContext, (0, response_1.asyncHandler)(async (req, res) => {
    const storeId = req.params.id;
    await storeService.deleteStore(storeId, req.tenantId);
    (0, response_1.deletedResponse)(res, 'Store deleted successfully');
}));
// Get store statistics
router.get('/:id/stats', middleware_1.setStoreContext, (0, response_1.asyncHandler)(async (req, res) => {
    const storeId = req.params.id;
    const stats = await storeService.getStoreStats(storeId, req.tenantId);
    (0, response_1.successResponse)(res, stats, 'Store statistics retrieved successfully');
}));
// Activate store
router.post('/:id/activate', middleware_1.setStoreContext, (0, response_1.asyncHandler)(async (req, res) => {
    const storeId = req.params.id;
    const store = await storeService.activateStore(storeId, req.tenantId);
    (0, response_1.updatedResponse)(res, store, 'Store activated successfully');
}));
// Deactivate store
router.post('/:id/deactivate', middleware_1.setStoreContext, (0, response_1.asyncHandler)(async (req, res) => {
    const storeId = req.params.id;
    const store = await storeService.deactivateStore(storeId, req.tenantId);
    (0, response_1.updatedResponse)(res, store, 'Store deactivated successfully');
}));
// Validate store_id uniqueness within tenant
router.post('/validate-store-id', (0, response_1.asyncHandler)(async (req, res) => {
    const { store_id, exclude_store_id } = req.body;
    if (!store_id) {
        return (0, response_1.errorResponse)(res, 'Store ID is required', 400, 'MISSING_FIELDS');
    }
    const isUnique = await storeService.validateStoreIdUniqueness(store_id, req.tenantId, exclude_store_id);
    (0, response_1.successResponse)(res, { is_unique: isUnique }, 'Store ID validation completed');
}));
exports.default = router;
//# sourceMappingURL=stores.js.map