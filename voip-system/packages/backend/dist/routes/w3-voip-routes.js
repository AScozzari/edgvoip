"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const w3_voip_service_1 = require("../services/w3-voip-service");
const tenant_context_1 = require("../middleware/tenant-context");
const router = (0, express_1.Router)();
const w3VoipService = new w3_voip_service_1.W3VoipService();
// Apply tenant context middleware to all routes
router.use(tenant_context_1.tenantContextMiddleware);
// ===== VOIP TRUNKS =====
router.post('/trunks', async (req, res) => {
    try {
        const data = req.body;
        const trunk = await w3VoipService.createTrunk(req.tenantContext, data);
        res.status(201).json({
            success: true,
            data: trunk
        });
    }
    catch (error) {
        console.error('Error creating trunk:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create trunk',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/trunks', async (req, res) => {
    try {
        const tenantId = req.tenantContext.tenant_id;
        const storeId = req.query.store_id;
        const trunks = await w3VoipService.getTrunks(tenantId, storeId);
        res.json({
            success: true,
            data: trunks
        });
    }
    catch (error) {
        console.error('Error fetching trunks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trunks',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/trunks/:id', async (req, res) => {
    try {
        const trunkId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const trunk = await w3VoipService.getTrunkById(trunkId, tenantId);
        if (!trunk) {
            return res.status(404).json({
                success: false,
                message: 'Trunk not found'
            });
        }
        res.json({
            success: true,
            data: trunk
        });
    }
    catch (error) {
        console.error('Error fetching trunk:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trunk',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/trunks/:id', async (req, res) => {
    try {
        const trunkId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const data = req.body;
        const trunk = await w3VoipService.updateTrunk(trunkId, tenantId, data);
        if (!trunk) {
            return res.status(404).json({
                success: false,
                message: 'Trunk not found'
            });
        }
        res.json({
            success: true,
            data: trunk
        });
    }
    catch (error) {
        console.error('Error updating trunk:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update trunk',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/trunks/:id', async (req, res) => {
    try {
        const trunkId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const deleted = await w3VoipService.deleteTrunk(trunkId, tenantId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Trunk not found'
            });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting trunk:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete trunk',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ===== VOIP DIDS =====
router.post('/dids', async (req, res) => {
    try {
        const data = req.body;
        const did = await w3VoipService.createDid(req.tenantContext, data);
        res.status(201).json({
            success: true,
            data: did
        });
    }
    catch (error) {
        console.error('Error creating DID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create DID',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/dids', async (req, res) => {
    try {
        const tenantId = req.tenantContext.tenant_id;
        const storeId = req.query.store_id;
        const dids = await w3VoipService.getDids(tenantId, storeId);
        res.json({
            success: true,
            data: dids
        });
    }
    catch (error) {
        console.error('Error fetching DIDs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch DIDs',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/dids/:id', async (req, res) => {
    try {
        const didId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const did = await w3VoipService.getDidById(didId, tenantId);
        if (!did) {
            return res.status(404).json({
                success: false,
                message: 'DID not found'
            });
        }
        res.json({
            success: true,
            data: did
        });
    }
    catch (error) {
        console.error('Error fetching DID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch DID',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/dids/:id', async (req, res) => {
    try {
        const didId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const data = req.body;
        const did = await w3VoipService.updateDid(didId, tenantId, data);
        if (!did) {
            return res.status(404).json({
                success: false,
                message: 'DID not found'
            });
        }
        res.json({
            success: true,
            data: did
        });
    }
    catch (error) {
        console.error('Error updating DID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update DID',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/dids/:id', async (req, res) => {
    try {
        const didId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const deleted = await w3VoipService.deleteDid(didId, tenantId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'DID not found'
            });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting DID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete DID',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ===== VOIP EXTENSIONS =====
router.post('/extensions', async (req, res) => {
    try {
        const data = req.body;
        const extension = await w3VoipService.createExtension(req.tenantContext, data);
        res.status(201).json({
            success: true,
            data: extension
        });
    }
    catch (error) {
        console.error('Error creating extension:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create extension',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/extensions', async (req, res) => {
    try {
        const tenantId = req.tenantContext.tenant_id;
        const storeId = req.query.store_id;
        const extensions = await w3VoipService.getExtensions(tenantId, storeId);
        res.json({
            success: true,
            data: extensions
        });
    }
    catch (error) {
        console.error('Error fetching extensions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch extensions',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/extensions/:id', async (req, res) => {
    try {
        const extensionId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const extension = await w3VoipService.getExtensionById(extensionId, tenantId);
        if (!extension) {
            return res.status(404).json({
                success: false,
                message: 'Extension not found'
            });
        }
        res.json({
            success: true,
            data: extension
        });
    }
    catch (error) {
        console.error('Error fetching extension:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch extension',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/extensions/:id', async (req, res) => {
    try {
        const extensionId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const data = req.body;
        const extension = await w3VoipService.updateExtension(extensionId, tenantId, data);
        if (!extension) {
            return res.status(404).json({
                success: false,
                message: 'Extension not found'
            });
        }
        res.json({
            success: true,
            data: extension
        });
    }
    catch (error) {
        console.error('Error updating extension:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update extension',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/extensions/:id', async (req, res) => {
    try {
        const extensionId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const deleted = await w3VoipService.deleteExtension(extensionId, tenantId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Extension not found'
            });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting extension:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete extension',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ===== VOIP ROUTES =====
router.post('/routes', async (req, res) => {
    try {
        const data = req.body;
        const route = await w3VoipService.createRoute(req.tenantContext, data);
        res.status(201).json({
            success: true,
            data: route
        });
    }
    catch (error) {
        console.error('Error creating route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create route',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/routes', async (req, res) => {
    try {
        const tenantId = req.tenantContext.tenant_id;
        const routes = await w3VoipService.getRoutes(tenantId);
        res.json({
            success: true,
            data: routes
        });
    }
    catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch routes',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/routes/:id', async (req, res) => {
    try {
        const routeId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const route = await w3VoipService.getRouteById(routeId, tenantId);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }
        res.json({
            success: true,
            data: route
        });
    }
    catch (error) {
        console.error('Error fetching route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch route',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/routes/:id', async (req, res) => {
    try {
        const routeId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const data = req.body;
        const route = await w3VoipService.updateRoute(routeId, tenantId, data);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }
        res.json({
            success: true,
            data: route
        });
    }
    catch (error) {
        console.error('Error updating route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update route',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/routes/:id', async (req, res) => {
    try {
        const routeId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const deleted = await w3VoipService.deleteRoute(routeId, tenantId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete route',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ===== CONTACT POLICIES =====
router.post('/contact-policies', async (req, res) => {
    try {
        const data = req.body;
        const policy = await w3VoipService.createContactPolicy(req.tenantContext, data);
        res.status(201).json({
            success: true,
            data: policy
        });
    }
    catch (error) {
        console.error('Error creating contact policy:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create contact policy',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/contact-policies', async (req, res) => {
    try {
        const tenantId = req.tenantContext.tenant_id;
        const policies = await w3VoipService.getContactPolicies(tenantId);
        res.json({
            success: true,
            data: policies
        });
    }
    catch (error) {
        console.error('Error fetching contact policies:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact policies',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/contact-policies/:id', async (req, res) => {
    try {
        const policyId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const policy = await w3VoipService.getContactPolicyById(policyId, tenantId);
        if (!policy) {
            return res.status(404).json({
                success: false,
                message: 'Contact policy not found'
            });
        }
        res.json({
            success: true,
            data: policy
        });
    }
    catch (error) {
        console.error('Error fetching contact policy:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact policy',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/contact-policies/:id', async (req, res) => {
    try {
        const policyId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const data = req.body;
        const policy = await w3VoipService.updateContactPolicy(policyId, tenantId, data);
        if (!policy) {
            return res.status(404).json({
                success: false,
                message: 'Contact policy not found'
            });
        }
        res.json({
            success: true,
            data: policy
        });
    }
    catch (error) {
        console.error('Error updating contact policy:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update contact policy',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/contact-policies/:id', async (req, res) => {
    try {
        const policyId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const deleted = await w3VoipService.deleteContactPolicy(policyId, tenantId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Contact policy not found'
            });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting contact policy:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete contact policy',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=w3-voip-routes.js.map