import { Router } from 'express';
import { StoreService } from '../services/store.service';
import {
  authenticateToken,
  requireTenant,
  setTenantContext,
  setStoreContext,
  validateStore,
  handleValidationErrors,
  validatePagination
} from '../middleware';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  updatedResponse,
  deletedResponse,
  notFoundResponse,
  asyncHandler
} from '../utils/response';

const router = Router();
const storeService = new StoreService();

// Apply authentication and tenant context to all routes
router.use(authenticateToken);
router.use(requireTenant);
router.use(setTenantContext);

// Create store
router.post('/',
  validateStore,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const storeData = {
      ...req.body,
      tenant_id: req.tenantId
    };
    
    const store = await storeService.createStore(storeData);
    createdResponse(res, store, 'Store created successfully');
  })
);

// List stores for tenant
router.get('/',
  validatePagination,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.q as string;

    const result = await storeService.listStores(req.tenantId!, page, limit, search);
    
    paginatedResponse(res, result.stores, {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    }, 'Stores retrieved successfully');
  })
);

// Get store by ID
router.get('/:id',
  setStoreContext,
  asyncHandler(async (req, res) => {
    const storeId = req.params.id;
    const store = await storeService.getStoreById(storeId, req.tenantId);
    
    if (!store) {
      return notFoundResponse(res, 'Store not found');
    }

    successResponse(res, store, 'Store retrieved successfully');
  })
);

// Update store
router.put('/:id',
  setStoreContext,
  validateStore,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const storeId = req.params.id;
    const store = await storeService.updateStore(storeId, req.body, req.tenantId);
    updatedResponse(res, store, 'Store updated successfully');
  })
);

// Delete store
router.delete('/:id',
  setStoreContext,
  asyncHandler(async (req, res) => {
    const storeId = req.params.id;
    await storeService.deleteStore(storeId, req.tenantId);
    deletedResponse(res, 'Store deleted successfully');
  })
);

// Get store statistics
router.get('/:id/stats',
  setStoreContext,
  asyncHandler(async (req, res) => {
    const storeId = req.params.id;
    const stats = await storeService.getStoreStats(storeId, req.tenantId);
    successResponse(res, stats, 'Store statistics retrieved successfully');
  })
);

// Activate store
router.post('/:id/activate',
  setStoreContext,
  asyncHandler(async (req, res) => {
    const storeId = req.params.id;
    const store = await storeService.activateStore(storeId, req.tenantId);
    updatedResponse(res, store, 'Store activated successfully');
  })
);

// Deactivate store
router.post('/:id/deactivate',
  setStoreContext,
  asyncHandler(async (req, res) => {
    const storeId = req.params.id;
    const store = await storeService.deactivateStore(storeId, req.tenantId);
    updatedResponse(res, store, 'Store deactivated successfully');
  })
);

// Validate store_id uniqueness within tenant
router.post('/validate-store-id',
  asyncHandler(async (req, res) => {
    const { store_id, exclude_store_id } = req.body;
    
    if (!store_id) {
      return errorResponse(res, 'Store ID is required', 400, 'MISSING_FIELDS');
    }

    const isUnique = await storeService.validateStoreIdUniqueness(store_id, req.tenantId!, exclude_store_id);
    
    successResponse(res, { is_unique: isUnique }, 'Store ID validation completed');
  })
);

export default router;

