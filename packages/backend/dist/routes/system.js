"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// FreeSWITCH status
// GET /api/freeswitch/status
router.get('/freeswitch/status', (req, res) => {
    // Check if FreeSWITCH is running by testing the port
    const net = require('net');
    const client = new net.Socket();
    client.setTimeout(1000);
    client.connect(8021, '127.0.0.1', () => {
        client.destroy();
        return res.json({
            success: true,
            data: {
                connected: true,
                message: 'FreeSWITCH ESL is running and accessible',
                timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
        });
    });
    client.on('error', () => {
        return res.json({
            success: true,
            data: {
                connected: false,
                message: 'FreeSWITCH ESL is not accessible',
                timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
        });
    });
});
// Placeholder: CDR aggregated stats
// GET /api/cdr-activity/cdr/stats
router.get('/cdr-activity/cdr/stats', (req, res) => {
    return res.json({
        success: true,
        data: {
            totalCalls: 0,
            answeredCalls: 0,
            missedCalls: 0,
            averageDuration: 0,
            timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=system.js.map