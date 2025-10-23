import { Router } from 'express';
import { freeSwitchXmlService } from '../services/freeswitch-xml.service';

const router = Router();

router.get('/xml', async (req, res) => {
  try {
    console.log('FreeSWITCH XML GET Request:', req.query);
    const params: any = { ...req.query };
    const xml = await freeSwitchXmlService.processXmlRequest(params);
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('FreeSWITCH XML GET error:', error);
    res.setHeader('Content-Type', 'application/xml');
    res.status(500).send('<document type=" freeswitch/xml\><section name=\result\><result status=\error\/></section></document>');
 }
});

router.post('/xml', async (req, res) => {
 try {
 console.log('FreeSWITCH XML POST Request:', { body: req.body, query: req.query });
 const params: any = { ...req.body, ...req.query };
 const xml = await freeSwitchXmlService.processXmlRequest(params);
 res.setHeader('Content-Type', 'application/xml');
 res.send(xml);
 } catch (error) {
 console.error('FreeSWITCH XML POST error:', error);
 res.setHeader('Content-Type', 'application/xml');
 res.status(500).send('<document type=\freeswitch/xml\><section name=\result\><result status=\error\/></section></document>');
 }
});

export default router;
