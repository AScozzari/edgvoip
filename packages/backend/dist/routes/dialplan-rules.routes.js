"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dialplan_rules_service_1 = require("../services/dialplan-rules.service");
const auth_1 = require("../middleware/auth");
const tenant_auth_1 = require("../middleware/tenant-auth");
const response_1 = require("../utils/response");
const router = express_1.default.Router();
const dialplanRulesService = new dialplan_rules_service_1.DialplanRulesService();
// Apply authentication to all routes
router.use(auth_1.authenticateToken);
/**
 * GET /api/dialplan/rules
 * List all dialplan rules for a tenant or specific context
 */
router.get('/rules', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const { tenant_id, context } = req.query;
    if (!tenant_id) {
        return (0, response_1.errorResponse)(res, 'tenant_id is required', 400);
    }
    let rules;
    if (context) {
        rules = await dialplanRulesService.getRulesByContext(tenant_id, context);
    }
    else {
        rules = await dialplanRulesService.getRulesByTenant(tenant_id);
    }
    (0, response_1.successResponse)(res, { rules, total: rules.length }, 'Dialplan rules retrieved successfully');
}));
/**
 * POST /api/dialplan/rules
 * Create a new dialplan rule
 */
router.post('/rules', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const ruleData = req.body;
    // Validate pattern
    if (!dialplanRulesService.validatePattern(ruleData.match_pattern)) {
        return (0, response_1.errorResponse)(res, 'Invalid regex pattern', 400, 'INVALID_PATTERN');
    }
    const rule = await dialplanRulesService.createRule(ruleData);
    (0, response_1.successResponse)(res, rule, 'Dialplan rule created successfully', 201);
}));
/**
 * PUT /api/dialplan/rules/:id
 * Update an existing dialplan rule
 */
router.put('/rules/:id', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    // Validate pattern if provided
    if (updates.match_pattern && !dialplanRulesService.validatePattern(updates.match_pattern)) {
        return (0, response_1.errorResponse)(res, 'Invalid regex pattern', 400, 'INVALID_PATTERN');
    }
    const rule = await dialplanRulesService.updateRule(id, updates);
    (0, response_1.successResponse)(res, rule, 'Dialplan rule updated successfully');
}));
/**
 * DELETE /api/dialplan/rules/:id
 * Delete a dialplan rule
 */
router.delete('/rules/:id', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await dialplanRulesService.deleteRule(id);
    (0, response_1.successResponse)(res, { deleted: true }, 'Dialplan rule deleted successfully');
}));
/**
 * POST /api/dialplan/rules/:id/test
 * Test a dialplan rule against a phone number
 */
router.post('/rules/:id/test', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { number } = req.body;
    if (!number) {
        return (0, response_1.errorResponse)(res, 'number is required', 400);
    }
    // Get the rule
    const rules = await dialplanRulesService.getRulesByTenant(req.user.tenant_id);
    const rule = rules.find((r) => r.id === id);
    if (!rule) {
        return (0, response_1.errorResponse)(res, 'Rule not found', 404);
    }
    const matches = dialplanRulesService.testRule(rule, number);
    (0, response_1.successResponse)(res, {
        matches,
        rule_name: rule.name,
        pattern: rule.match_pattern,
        number_tested: number,
    }, matches ? 'Number matches rule' : 'Number does not match rule');
}));
/**
 * POST /api/dialplan/test-pattern
 * Test a regex pattern against a phone number (without creating a rule)
 */
router.post('/test-pattern', auth_1.authenticateToken, (0, response_1.asyncHandler)(async (req, res) => {
    const { pattern, number } = req.body;
    if (!pattern || !number) {
        return (0, response_1.errorResponse)(res, 'pattern and number are required', 400);
    }
    // Validate pattern
    if (!dialplanRulesService.validatePattern(pattern)) {
        return (0, response_1.errorResponse)(res, 'Invalid regex pattern', 400, 'INVALID_PATTERN');
    }
    const result = dialplanRulesService.testPattern(pattern, number);
    (0, response_1.successResponse)(res, {
        ...result,
        pattern,
        number,
    }, result.match ? 'Pattern matches' : 'Pattern does not match');
}));
exports.default = router;
//# sourceMappingURL=dialplan-rules.routes.js.map