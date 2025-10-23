import { Router } from 'express';
import { ExtensionService } from '../services/extension.service';
import {
  authenticateToken,
  requireTenant,
  setTenantContext,
  validatePagination,
  handleValidationErrors,
} from '../middleware';
import {
  paginatedResponse,
  successResponse,
  notFoundResponse,
  asyncHandler
} from '../utils/response';

const router = Router();
const extensionService = new ExtensionService();

// Apply authentication and tenant context to all routes
router.use(authenticateToken);
router.use(requireTenant);
router.use(setTenantContext);

// List SIP Extensions for tenant
router.get('/sip-extensions',
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
    }, 'SIP Extensions retrieved successfully');
  })
);

// Get SIP Extension by ID
router.get('/sip-extensions/:id',
  asyncHandler(async (req, res) => {
    const extensionId = req.params.id;
    const extension = await extensionService.getExtensionById(extensionId, req.tenantId);

    if (!extension) {
      return notFoundResponse(res, 'SIP Extension not found');
    }

    successResponse(res, extension, 'SIP Extension retrieved successfully');
  })
);

// Get SIP Extension by number
router.get('/sip-extensions/number/:extension',
  asyncHandler(async (req, res) => {
    const extensionNumber = req.params.extension;
    const extension = await extensionService.getExtensionByNumber(extensionNumber, req.tenantId!);

    if (!extension) {
      return notFoundResponse(res, 'SIP Extension not found');
    }

    successResponse(res, extension, 'SIP Extension retrieved successfully');
  })
);

export default router;
