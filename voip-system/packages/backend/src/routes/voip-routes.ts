// @ts-nocheck
import { Router } from 'express';
import { VoipService } from '../services/voip-service';
import { tenantContextMiddleware } from '../middleware/tenant-context';
// import { 
//   InboundRoute, 
//   OutboundRoute, 
//   TimeCondition, 
//   IvrMenu, 
//   RingGroup, 
//   Queue, 
//   ConferenceRoom, 
//   VoicemailBox,
//   SipExtensionConfig,
//   SipTrunkConfig,
//   OpenSipsRoute
// } from '@w3-voip/shared';

const router = Router();

// Apply tenant context middleware to all VoIP routes
router.use(tenantContextMiddleware);

// Initialize VoIP Service with configuration
const voipService = new VoipService(
  {
    host: process.env.FREESWITCH_HOST || '192.168.172.234',
    port: parseInt(process.env.FREESWITCH_PORT || '8021'),
    password: process.env.FREESWITCH_PASSWORD || 'ClueCon',
    context: process.env.FREESWITCH_CONTEXT || 'default'
  },
  {
    host: process.env.OPENSIPS_HOST || '192.168.172.234',
    port: parseInt(process.env.OPENSIPS_PORT || '5060'),
    database: {
      host: process.env.OPENSIPS_DB_HOST || '192.168.172.234',
      port: parseInt(process.env.OPENSIPS_DB_PORT || '5432'),
      name: process.env.OPENSIPS_DB_NAME || 'opensips',
      user: process.env.OPENSIPS_DB_USER || 'opensips',
      password: process.env.OPENSIPS_DB_PASSWORD || 'opensips'
    }
  },
  {
    host: process.env.FUSIONPBX_HOST || '192.168.172.234',
    port: parseInt(process.env.FUSIONPBX_PORT || '80'),
    database: {
      host: process.env.FUSIONPBX_DB_HOST || '192.168.172.234',
      port: parseInt(process.env.FUSIONPBX_DB_PORT || '5432'),
      name: process.env.FUSIONPBX_DB_NAME || 'fusionpbx',
      user: process.env.FUSIONPBX_DB_USER || 'fusionpbx',
      password: process.env.FUSIONPBX_DB_PASSWORD || 'fusionpbx'
    }
  }
);

// ===== INBOUND ROUTES =====
router.post('/inbound-routes', async (req, res) => {
  try {
    const route = req.body;
    const createdRoute = await voipService.createInboundRoute(req.tenantContext!, route);
    res.status(201).json(createdRoute);
  } catch (error) {
    console.error('Error creating inbound route:', error);
    res.status(500).json({ error: 'Failed to create inbound route' });
  }
});

router.get('/inbound-routes', async (req, res) => {
  try {
    // tenant_id is automatically available from tenantContext
    const tenantId = req.tenantContext!.tenant_id;
    const routes = await voipService.getInboundRoutes(tenantId);
    res.json(routes);
  } catch (error) {
    console.error('Error fetching inbound routes:', error);
    res.status(500).json({ error: 'Failed to fetch inbound routes' });
  }
});

router.get('/inbound-routes/:id', async (req, res) => {
  try {
    const routeId = req.params.id;
    // TODO: Implement get inbound route by ID from database
    res.json({});
  } catch (error) {
    console.error('Error fetching inbound route:', error);
    res.status(500).json({ error: 'Failed to fetch inbound route' });
  }
});

router.put('/inbound-routes/:id', async (req, res) => {
  try {
    const routeId = req.params.id;
    const route: Partial<InboundRoute> = req.body;
    const updatedRoute = await voipService.updateInboundRoute(routeId, route);
    res.json(updatedRoute);
  } catch (error) {
    console.error('Error updating inbound route:', error);
    res.status(500).json({ error: 'Failed to update inbound route' });
  }
});

router.delete('/inbound-routes/:id', async (req, res) => {
  try {
    const routeId = req.params.id;
    await voipService.deleteInboundRoute(routeId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting inbound route:', error);
    res.status(500).json({ error: 'Failed to delete inbound route' });
  }
});

// ===== OUTBOUND ROUTES =====
router.post('/outbound-routes', async (req, res) => {
  try {
    const route = req.body;
    const createdRoute = await voipService.createOutboundRoute(req.tenantContext!, route);
    res.status(201).json(createdRoute);
  } catch (error) {
    console.error('Error creating outbound route:', error);
    res.status(500).json({ error: 'Failed to create outbound route' });
  }
});

router.get('/outbound-routes', async (req, res) => {
  try {
    // tenant_id is automatically available from tenantContext
    const tenantId = req.tenantContext!.tenant_id;
    const routes = await voipService.getOutboundRoutes(tenantId);
    res.json(routes);
  } catch (error) {
    console.error('Error fetching outbound routes:', error);
    res.status(500).json({ error: 'Failed to fetch outbound routes' });
  }
});

router.get('/outbound-routes/:id', async (req, res) => {
  try {
    const routeId = req.params.id;
    // TODO: Implement get outbound route by ID from database
    res.json({});
  } catch (error) {
    console.error('Error fetching outbound route:', error);
    res.status(500).json({ error: 'Failed to fetch outbound route' });
  }
});

router.put('/outbound-routes/:id', async (req, res) => {
  try {
    const routeId = req.params.id;
    const route: Partial<OutboundRoute> = req.body;
    const updatedRoute = await voipService.updateOutboundRoute(routeId, route);
    res.json(updatedRoute);
  } catch (error) {
    console.error('Error updating outbound route:', error);
    res.status(500).json({ error: 'Failed to update outbound route' });
  }
});

router.delete('/outbound-routes/:id', async (req, res) => {
  try {
    const routeId = req.params.id;
    await voipService.deleteOutboundRoute(routeId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting outbound route:', error);
    res.status(500).json({ error: 'Failed to delete outbound route' });
  }
});

// ===== TIME CONDITIONS =====
router.post('/time-conditions', async (req, res) => {
  try {
    const condition = req.body;
    const createdCondition = await voipService.createTimeCondition(req.tenantContext!, condition);
    res.status(201).json(createdCondition);
  } catch (error) {
    console.error('Error creating time condition:', error);
    res.status(500).json({ error: 'Failed to create time condition' });
  }
});

router.get('/time-conditions', async (req, res) => {
  try {
    // tenant_id is automatically available from tenantContext
    const tenantId = req.tenantContext!.tenant_id;
    const conditions = await voipService.getTimeConditions(tenantId);
    res.json(conditions);
  } catch (error) {
    console.error('Error fetching time conditions:', error);
    res.status(500).json({ error: 'Failed to fetch time conditions' });
  }
});

router.get('/time-conditions/:id', async (req, res) => {
  try {
    const conditionId = req.params.id;
    // TODO: Implement get time condition by ID from database
    res.json({});
  } catch (error) {
    console.error('Error fetching time condition:', error);
    res.status(500).json({ error: 'Failed to fetch time condition' });
  }
});

router.put('/time-conditions/:id', async (req, res) => {
  try {
    const conditionId = req.params.id;
    const condition: Partial<TimeCondition> = req.body;
    const updatedCondition = await voipService.updateTimeCondition(conditionId, condition);
    res.json(updatedCondition);
  } catch (error) {
    console.error('Error updating time condition:', error);
    res.status(500).json({ error: 'Failed to update time condition' });
  }
});

router.delete('/time-conditions/:id', async (req, res) => {
  try {
    const conditionId = req.params.id;
    await voipService.deleteTimeCondition(conditionId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting time condition:', error);
    res.status(500).json({ error: 'Failed to delete time condition' });
  }
});

// ===== IVR MENUS =====
router.post('/ivr-menus', async (req, res) => {
  try {
    const menu = req.body;
    const createdMenu = await voipService.createIvrMenu(req.tenantContext!, menu);
    res.status(201).json(createdMenu);
  } catch (error) {
    console.error('Error creating IVR menu:', error);
    res.status(500).json({ error: 'Failed to create IVR menu' });
  }
});

router.get('/ivr-menus', async (req, res) => {
  try {
    // tenant_id is automatically available from tenantContext
    const tenantId = req.tenantContext!.tenant_id;
    const menus = await voipService.getIvrMenus(tenantId);
    res.json(menus);
  } catch (error) {
    console.error('Error fetching IVR menus:', error);
    res.status(500).json({ error: 'Failed to fetch IVR menus' });
  }
});

router.get('/ivr-menus/:id', async (req, res) => {
  try {
    const menuId = req.params.id;
    // TODO: Implement get IVR menu by ID from database
    res.json({});
  } catch (error) {
    console.error('Error fetching IVR menu:', error);
    res.status(500).json({ error: 'Failed to fetch IVR menu' });
  }
});

router.put('/ivr-menus/:id', async (req, res) => {
  try {
    const menuId = req.params.id;
    const menu: Partial<IvrMenu> = req.body;
    const updatedMenu = await voipService.updateIvrMenu(menuId, menu);
    res.json(updatedMenu);
  } catch (error) {
    console.error('Error updating IVR menu:', error);
    res.status(500).json({ error: 'Failed to update IVR menu' });
  }
});

router.delete('/ivr-menus/:id', async (req, res) => {
  try {
    const menuId = req.params.id;
    await voipService.deleteIvrMenu(menuId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting IVR menu:', error);
    res.status(500).json({ error: 'Failed to delete IVR menu' });
  }
});

// ===== RING GROUPS =====
router.post('/ring-groups', async (req, res) => {
  try {
    const group = req.body;
    const createdGroup = await voipService.createRingGroup(req.tenantContext!, group);
    res.status(201).json(createdGroup);
  } catch (error) {
    console.error('Error creating ring group:', error);
    res.status(500).json({ error: 'Failed to create ring group' });
  }
});

router.get('/ring-groups', async (req, res) => {
  try {
    // tenant_id is automatically available from tenantContext
    const tenantId = req.tenantContext!.tenant_id;
    const groups = await voipService.getRingGroups(tenantId);
    res.json(groups);
  } catch (error) {
    console.error('Error fetching ring groups:', error);
    res.status(500).json({ error: 'Failed to fetch ring groups' });
  }
});

router.get('/ring-groups/:id', async (req, res) => {
  try {
    const groupId = req.params.id;
    // TODO: Implement get ring group by ID from database
    res.json({});
  } catch (error) {
    console.error('Error fetching ring group:', error);
    res.status(500).json({ error: 'Failed to fetch ring group' });
  }
});

router.put('/ring-groups/:id', async (req, res) => {
  try {
    const groupId = req.params.id;
    const group: Partial<RingGroup> = req.body;
    const updatedGroup = await voipService.updateRingGroup(groupId, group);
    res.json(updatedGroup);
  } catch (error) {
    console.error('Error updating ring group:', error);
    res.status(500).json({ error: 'Failed to update ring group' });
  }
});

router.delete('/ring-groups/:id', async (req, res) => {
  try {
    const groupId = req.params.id;
    await voipService.deleteRingGroup(groupId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting ring group:', error);
    res.status(500).json({ error: 'Failed to delete ring group' });
  }
});

// ===== QUEUES =====
router.post('/queues', async (req, res) => {
  try {
    const queue = req.body;
    const createdQueue = await voipService.createQueue(req.tenantContext!, queue);
    res.status(201).json(createdQueue);
  } catch (error) {
    console.error('Error creating queue:', error);
    res.status(500).json({ error: 'Failed to create queue' });
  }
});

router.get('/queues', async (req, res) => {
  try {
    // tenant_id is automatically available from tenantContext
    const tenantId = req.tenantContext!.tenant_id;
    const queues = await voipService.getQueues(tenantId);
    res.json(queues);
  } catch (error) {
    console.error('Error fetching queues:', error);
    res.status(500).json({ error: 'Failed to fetch queues' });
  }
});

router.get('/queues/:id', async (req, res) => {
  try {
    const queueId = req.params.id;
    // TODO: Implement get queue by ID from database
    res.json({});
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

router.put('/queues/:id', async (req, res) => {
  try {
    const queueId = req.params.id;
    const queue: Partial<Queue> = req.body;
    const updatedQueue = await voipService.updateQueue(queueId, queue);
    res.json(updatedQueue);
  } catch (error) {
    console.error('Error updating queue:', error);
    res.status(500).json({ error: 'Failed to update queue' });
  }
});

router.delete('/queues/:id', async (req, res) => {
  try {
    const queueId = req.params.id;
    await voipService.deleteQueue(queueId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting queue:', error);
    res.status(500).json({ error: 'Failed to delete queue' });
  }
});

// ===== CONFERENCE ROOMS =====
router.post('/conference-rooms', async (req, res) => {
  try {
    const room = req.body;
    const createdRoom = await voipService.createConferenceRoom(req.tenantContext!, room);
    res.status(201).json(createdRoom);
  } catch (error) {
    console.error('Error creating conference room:', error);
    res.status(500).json({ error: 'Failed to create conference room' });
  }
});

router.get('/conference-rooms', async (req, res) => {
  try {
    // tenant_id is automatically available from tenantContext
    const tenantId = req.tenantContext!.tenant_id;
    const rooms = await voipService.getConferenceRooms(tenantId);
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching conference rooms:', error);
    res.status(500).json({ error: 'Failed to fetch conference rooms' });
  }
});

router.get('/conference-rooms/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    // TODO: Implement get conference room by ID from database
    res.json({});
  } catch (error) {
    console.error('Error fetching conference room:', error);
    res.status(500).json({ error: 'Failed to fetch conference room' });
  }
});

router.put('/conference-rooms/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    const room: Partial<ConferenceRoom> = req.body;
    const updatedRoom = await voipService.updateConferenceRoom(roomId, room);
    res.json(updatedRoom);
  } catch (error) {
    console.error('Error updating conference room:', error);
    res.status(500).json({ error: 'Failed to update conference room' });
  }
});

router.delete('/conference-rooms/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    await voipService.deleteConferenceRoom(roomId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting conference room:', error);
    res.status(500).json({ error: 'Failed to delete conference room' });
  }
});

// ===== VOICEMAIL BOXES =====
router.post('/voicemail-boxes', async (req, res) => {
  try {
    const box = req.body;
    const createdBox = await voipService.createVoicemailBox(req.tenantContext!, box);
    res.status(201).json(createdBox);
  } catch (error) {
    console.error('Error creating voicemail box:', error);
    res.status(500).json({ error: 'Failed to create voicemail box' });
  }
});

router.get('/voicemail-boxes', async (req, res) => {
  try {
    // tenant_id is automatically available from tenantContext
    const tenantId = req.tenantContext!.tenant_id;
    const boxes = await voipService.getVoicemailBoxes(tenantId);
    res.json(boxes);
  } catch (error) {
    console.error('Error fetching voicemail boxes:', error);
    res.status(500).json({ error: 'Failed to fetch voicemail boxes' });
  }
});

router.get('/voicemail-boxes/:id', async (req, res) => {
  try {
    const boxId = req.params.id;
    // TODO: Implement get voicemail box by ID from database
    res.json({});
  } catch (error) {
    console.error('Error fetching voicemail box:', error);
    res.status(500).json({ error: 'Failed to fetch voicemail box' });
  }
});

router.put('/voicemail-boxes/:id', async (req, res) => {
  try {
    const boxId = req.params.id;
    const box: Partial<VoicemailBox> = req.body;
    const updatedBox = await voipService.updateVoicemailBox(boxId, box);
    res.json(updatedBox);
  } catch (error) {
    console.error('Error updating voicemail box:', error);
    res.status(500).json({ error: 'Failed to update voicemail box' });
  }
});

router.delete('/voicemail-boxes/:id', async (req, res) => {
  try {
    const boxId = req.params.id;
    await voipService.deleteVoicemailBox(boxId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting voicemail box:', error);
    res.status(500).json({ error: 'Failed to delete voicemail box' });
  }
});

// ===== SIP EXTENSIONS =====
router.post('/sip-extensions', async (req, res) => {
  try {
    const extension = req.body;
    const createdExtension = await voipService.createSipExtension(req.tenantContext!, extension);
    res.status(201).json(createdExtension);
  } catch (error) {
    console.error('Error creating SIP extension:', error);
    res.status(500).json({ error: 'Failed to create SIP extension' });
  }
});

router.get('/sip-extensions', async (req, res) => {
  try {
    // tenant_id is automatically available from tenantContext
    const tenantId = req.tenantContext!.tenant_id;
    const extensions = await voipService.getSipExtensions(tenantId);
    res.json(extensions);
  } catch (error) {
    console.error('Error fetching SIP extensions:', error);
    res.status(500).json({ error: 'Failed to fetch SIP extensions' });
  }
});

router.get('/sip-extensions/:id', async (req, res) => {
  try {
    const extensionId = req.params.id;
    // TODO: Implement get SIP extension by ID from database
    res.json({});
  } catch (error) {
    console.error('Error fetching SIP extension:', error);
    res.status(500).json({ error: 'Failed to fetch SIP extension' });
  }
});

router.put('/sip-extensions/:id', async (req, res) => {
  try {
    const extensionId = req.params.id;
    const extension: Partial<SipExtensionConfig> = req.body;
    const updatedExtension = await voipService.updateSipExtension(extensionId, extension);
    res.json(updatedExtension);
  } catch (error) {
    console.error('Error updating SIP extension:', error);
    res.status(500).json({ error: 'Failed to update SIP extension' });
  }
});

router.delete('/sip-extensions/:id', async (req, res) => {
  try {
    const extensionId = req.params.id;
    await voipService.deleteSipExtension(extensionId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting SIP extension:', error);
    res.status(500).json({ error: 'Failed to delete SIP extension' });
  }
});

// ===== SIP TRUNKS =====
router.post('/sip-trunks', async (req, res) => {
  try {
    const trunk = req.body;
    const createdTrunk = await voipService.createSipTrunk(req.tenantContext!, trunk);
    res.status(201).json(createdTrunk);
  } catch (error) {
    console.error('Error creating SIP trunk:', error);
    res.status(500).json({ error: 'Failed to create SIP trunk' });
  }
});

router.get('/sip-trunks', async (req, res) => {
  try {
    // tenant_id is automatically available from tenantContext
    const tenantId = req.tenantContext!.tenant_id;
    const trunks = await voipService.getSipTrunks(tenantId);
    res.json({
      success: true,
      data: trunks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching SIP trunks:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch SIP trunks',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/sip-trunks/:id', async (req, res) => {
  try {
    const trunkId = req.params.id;
    // TODO: Implement get SIP trunk by ID from database
    res.json({});
  } catch (error) {
    console.error('Error fetching SIP trunk:', error);
    res.status(500).json({ error: 'Failed to fetch SIP trunk' });
  }
});

router.put('/sip-trunks/:id', async (req, res) => {
  try {
    const trunkId = req.params.id;
    const trunk: Partial<SipTrunkConfig> = req.body;
    const updatedTrunk = await voipService.updateSipTrunk(trunkId, trunk);
    res.json(updatedTrunk);
  } catch (error) {
    console.error('Error updating SIP trunk:', error);
    res.status(500).json({ error: 'Failed to update SIP trunk' });
  }
});

router.delete('/sip-trunks/:id', async (req, res) => {
  try {
    const trunkId = req.params.id;
    await voipService.deleteSipTrunk(trunkId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting SIP trunk:', error);
    res.status(500).json({ error: 'Failed to delete SIP trunk' });
  }
});

// ===== OPENSIPS ROUTES =====
router.post('/opensips-routes', async (req, res) => {
  try {
    const route: OpenSipsRoute = req.body;
    const createdRoute = await voipService.createOpenSipsRoute(route);
    res.status(201).json(createdRoute);
  } catch (error) {
    console.error('Error creating OpenSIPS route:', error);
    res.status(500).json({ error: 'Failed to create OpenSIPS route' });
  }
});

router.get('/opensips-routes', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id as string;
    // TODO: Implement get OpenSIPS routes from database
    res.json([]);
  } catch (error) {
    console.error('Error fetching OpenSIPS routes:', error);
    res.status(500).json({ error: 'Failed to fetch OpenSIPS routes' });
  }
});

router.get('/opensips-routes/:id', async (req, res) => {
  try {
    const routeId = req.params.id;
    // TODO: Implement get OpenSIPS route by ID from database
    res.json({});
  } catch (error) {
    console.error('Error fetching OpenSIPS route:', error);
    res.status(500).json({ error: 'Failed to fetch OpenSIPS route' });
  }
});

router.put('/opensips-routes/:id', async (req, res) => {
  try {
    const routeId = req.params.id;
    const route: Partial<OpenSipsRoute> = req.body;
    const updatedRoute = await voipService.updateOpenSipsRoute(routeId, route);
    res.json(updatedRoute);
  } catch (error) {
    console.error('Error updating OpenSIPS route:', error);
    res.status(500).json({ error: 'Failed to update OpenSIPS route' });
  }
});

router.delete('/opensips-routes/:id', async (req, res) => {
  try {
    const routeId = req.params.id;
    await voipService.deleteOpenSipsRoute(routeId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting OpenSIPS route:', error);
    res.status(500).json({ error: 'Failed to delete OpenSIPS route' });
  }
});

export default router;
