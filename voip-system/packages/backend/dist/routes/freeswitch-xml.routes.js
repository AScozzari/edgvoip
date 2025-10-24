"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const freeswitch_xml_service_1 = require("../services/freeswitch-xml.service");
const router = (0, express_1.Router)();
router.get('/xml', async (req, res) => {
    try {
        console.log('FreeSWITCH XML GET Request:', req.query);
        const params = { ...req.query };
        const xml = await freeswitch_xml_service_1.freeSwitchXmlService.processXmlRequest(params);
        res.setHeader('Content-Type', 'application/xml');
        res.send(xml);
    }
    catch (error) {
        console.error('FreeSWITCH XML GET error:', error);
        res.setHeader('Content-Type', 'application/xml');
        res.status(500).send('<document type=" freeswitch/xml\><section name=\result\><result status=\error\/></section></document>');
    }
});
router.post('/xml', async (req, res) => {
    try {
        console.log('FreeSWITCH XML POST Request:', { body: req.body, query: req.query });
        const params = { ...req.body, ...req.query };
        const xml = await freeswitch_xml_service_1.freeSwitchXmlService.processXmlRequest(params);
        res.setHeader('Content-Type', 'application/xml');
        res.send(xml);
    }
    catch (error) {
        console.error('FreeSWITCH XML POST error:', error);
        res.setHeader('Content-Type', 'application/xml');
        res.status(500).send('<document type=\freeswitch/xml\><section name=\result\><result status=\error\/></section></document>');
    }
});
exports.default = router;
//# sourceMappingURL=freeswitch-xml.routes.js.map