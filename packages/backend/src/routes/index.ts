import { Router } from 'express';
import authRouter from './auth.routes';
import tenantsRouter from './tenants';
import storesRouter from './stores';
import usersRouter from './users.routes';
import extensionsRouter from './extensions';
import callRoutes from './calls';
import cdrRoutes from './cdr';
import webhookRoutes from './webhooks';
import analyticsRouter from './analytics';
import systemRouter from './system';
import voipRouter from './voip';
import sipTrunksRouter from './sip-trunks';
import freeswitchXmlRouter from './freeswitch-xml.routes';
import freeswitchDeployRouter from './freeswitch-deploy.routes';
import dialplanRulesRouter from './dialplan-rules.routes';
import routingRouter from './routing.routes';

const router = Router();

// FreeSWITCH XML Curl endpoint (NO auth - internal FreeSWITCH call)
router.use('/freeswitch', freeswitchXmlRouter);

// API routes - SPECIFIC ROUTES FIRST, then catch-all routers
router.use('/tenants', tenantsRouter);
router.use('/stores', storesRouter);
router.use('/users', usersRouter);
router.use('/extensions', extensionsRouter);
router.use('/calls', callRoutes);
router.use('/cdr', cdrRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/analytics', analyticsRouter);
router.use('/voip', voipRouter);
router.use('/sip-trunks', sipTrunksRouter);
router.use('/freeswitch-deploy', freeswitchDeployRouter);
router.use('/dialplan', dialplanRulesRouter);
router.use('/routing', routingRouter);

// Health check endpoint - BEFORE catch-all routers
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

// Mount routers with root paths LAST to avoid catching other routes
router.use('/', systemRouter);
router.use('/', authRouter); // Auth routes at root level (/:tenantSlug/login, /:tenantSlug/validate)

export default router;
