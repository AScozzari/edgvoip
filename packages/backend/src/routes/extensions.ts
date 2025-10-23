import { Router } from 'express';
import { ExtensionService } from '../services/extension.service';
import {
  authenticateToken,
  requireTenant,
  setTenantContext,
  setStoreContext,
  validateExtension,
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
const extensionService = new ExtensionService();

// Apply authentication and tenant context to all routes
router.use(authenticateToken);
router.use(requireTenant);
router.use(setTenantContext);

// Create extension
router.post('/',
  validateExtension,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const extensionData = {
      ...req.body,
      tenant_id: req.tenantId,
      store_id: req.body.store_id || null
    };
    
    const extension = await extensionService.createExtension(extensionData);
    createdResponse(res, extension, 'Extension created successfully');
  })
);

// List extensions for tenant
router.get('/',
  validatePagination,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.q as string;
    const storeId = req.query.store_id as string;

    const result = await extensionService.listExtensions(req.tenantId!, storeId, page, limit, search);
    
    paginatedResponse(res, result.extensions, {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    }, 'Extensions retrieved successfully');
  })
);

// Get extension by ID
router.get('/:id',
  asyncHandler(async (req, res) => {
    const extensionId = req.params.id;
    const extension = await extensionService.getExtensionById(extensionId, req.tenantId);
    
    if (!extension) {
      return notFoundResponse(res, 'Extension not found');
    }

    successResponse(res, extension, 'Extension retrieved successfully');
  })
);

// Get extension by number
router.get('/number/:extension',
  asyncHandler(async (req, res) => {
    const extension = req.params.extension;
    const ext = await extensionService.getExtensionByNumber(extension, req.tenantId!);
    
    if (!ext) {
      return notFoundResponse(res, 'Extension not found');
    }

    successResponse(res, ext, 'Extension retrieved successfully');
  })
);

// Update extension
router.put('/:id',
  validateExtension,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const extensionId = req.params.id;
    const extension = await extensionService.updateExtension(extensionId, req.body, req.tenantId);
    updatedResponse(res, extension, 'Extension updated successfully');
  })
);

// Delete extension
router.delete('/:id',
  asyncHandler(async (req, res) => {
    const extensionId = req.params.id;
    await extensionService.deleteExtension(extensionId, req.tenantId);
    deletedResponse(res, 'Extension deleted successfully');
  })
);

// Verify extension password (for authentication)
router.post('/verify-password',
  asyncHandler(async (req, res) => {
    const { extension, password } = req.body;
    
    if (!extension || !password) {
      return errorResponse(res, 'Extension and password are required', 400, 'MISSING_FIELDS');
    }

    const ext = await extensionService.verifyExtensionPassword(extension, password, req.tenantId!);
    
    if (!ext) {
      return errorResponse(res, 'Invalid extension or password', 401, 'INVALID_CREDENTIALS');
    }

    successResponse(res, ext, 'Extension authenticated successfully');
  })
);

// Get extension statistics
router.get('/:id/stats',
  asyncHandler(async (req, res) => {
    const extensionId = req.params.id;
    const stats = await extensionService.getExtensionStats(extensionId, req.tenantId);
    successResponse(res, stats, 'Extension statistics retrieved successfully');
  })
);

// Activate extension
router.post('/:id/activate',
  asyncHandler(async (req, res) => {
    const extensionId = req.params.id;
    const extension = await extensionService.activateExtension(extensionId, req.tenantId);
    updatedResponse(res, extension, 'Extension activated successfully');
  })
);

// Deactivate extension
router.post('/:id/deactivate',
  asyncHandler(async (req, res) => {
    const extensionId = req.params.id;
    const extension = await extensionService.deactivateExtension(extensionId, req.tenantId);
    updatedResponse(res, extension, 'Extension deactivated successfully');
  })
);

// Lock extension
router.post('/:id/lock',
  asyncHandler(async (req, res) => {
    const extensionId = req.params.id;
    const extension = await extensionService.lockExtension(extensionId, req.tenantId);
    updatedResponse(res, extension, 'Extension locked successfully');
  })
);

// Validate extension number uniqueness within tenant
router.post('/validate-extension',
  asyncHandler(async (req, res) => {
    const { extension, exclude_extension_id } = req.body;
    
    if (!extension) {
      return errorResponse(res, 'Extension number is required', 400, 'MISSING_FIELDS');
    }

    const isUnique = await extensionService.validateExtensionUniqueness(extension, req.tenantId!, exclude_extension_id);
    
    successResponse(res, { is_unique: isUnique }, 'Extension validation completed');
  })
);

// Get extensions by store
router.get('/store/:storeId',
  setStoreContext,
  validatePagination,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const storeId = req.params.storeId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.q as string;

    const result = await extensionService.listExtensions(req.tenantId!, storeId, page, limit, search);
    
    paginatedResponse(res, result.extensions, {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    }, 'Store extensions retrieved successfully');
  })
);

export default router;

