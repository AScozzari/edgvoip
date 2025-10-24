"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const tenants_1 = __importDefault(require("./tenants"));
const stores_1 = __importDefault(require("./stores"));
const extensions_1 = __importDefault(require("./extensions"));
const calls_1 = __importDefault(require("./calls"));
const cdr_1 = __importDefault(require("./cdr"));
const webhooks_1 = __importDefault(require("./webhooks"));
const analytics_1 = __importDefault(require("./analytics"));
const system_1 = __importDefault(require("./system"));
const voip_1 = __importDefault(require("./voip"));
const sip_trunks_1 = __importDefault(require("./sip-trunks"));
const freeswitch_xml_routes_1 = __importDefault(require("./freeswitch-xml.routes"));
const router = (0, express_1.Router)();
// FreeSWITCH XML Curl endpoint (NO auth - internal FreeSWITCH call)
router.use('/freeswitch', freeswitch_xml_routes_1.default);
// API routes
router.use('/', auth_routes_1.default); // Auth routes at root level (/:tenantSlug/login)
router.use('/tenants', tenants_1.default);
router.use('/stores', stores_1.default);
router.use('/extensions', extensions_1.default);
router.use('/calls', calls_1.default);
router.use('/cdr', cdr_1.default);
router.use('/webhooks', webhooks_1.default);
router.use('/analytics', analytics_1.default);
router.use('/voip', voip_1.default);
router.use('/sip-trunks', sip_trunks_1.default);
router.use('/', system_1.default);
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0'
        }
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map