// @ts-nocheck
import express from 'express';
import { QueueService } from '../services/queue.service';
import { authenticateToken, AuthenticatedRequest as AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();
const queueService = new QueueService();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all queues for tenant
router.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).user.tenant_id;
    const queues = await queueService.listQueues(tenantId);
    res.json({ success: true, data: queues });
  } catch (error) {
    console.error('❌ Error listing queues:', error);
    res.status(500).json({ success: false, message: 'Failed to list queues' });
  }
});

// Get queue by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenant_id;
    
    const queue = await queueService.getQueueById(id, tenantId);
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }
    
    res.json({ success: true, data: queue });
  } catch (error) {
    console.error('❌ Error getting queue:', error);
    res.status(500).json({ success: false, message: 'Failed to get queue' });
  }
});

// Create new queue
router.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).user.tenant_id;
    const queueData = {
      ...req.body,
      tenant_id: tenantId,
      agents: req.body.agents || []
    };
    
    const queue = await queueService.createQueue(queueData);
    res.status(201).json({ success: true, data: queue });
  } catch (error) {
    console.error('❌ Error creating queue:', error);
    res.status(500).json({ success: false, message: 'Failed to create queue' });
  }
});

// Update queue
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenant_id;
    
    const queue = await queueService.updateQueue(id, tenantId, req.body);
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }
    
    res.json({ success: true, data: queue });
  } catch (error) {
    console.error('❌ Error updating queue:', error);
    res.status(500).json({ success: false, message: 'Failed to update queue' });
  }
});

// Delete queue
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenant_id;
    
    const success = await queueService.deleteQueue(id, tenantId);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }
    
    res.json({ success: true, message: 'Queue deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting queue:', error);
    res.status(500).json({ success: false, message: 'Failed to delete queue' });
  }
});

// Add agent to queue
router.post('/:id/agents', async (req, res) => {
  try {
    const { id } = req.params;
    const { extension_id } = req.body;
    const tenantId = (req as any).user.tenant_id;
    
    if (!extension_id) {
      return res.status(400).json({ success: false, message: 'Extension ID is required' });
    }
    
    const success = await queueService.addAgentToQueue(id, tenantId, extension_id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }
    
    res.json({ success: true, message: 'Agent added to queue successfully' });
  } catch (error) {
    console.error('❌ Error adding agent to queue:', error);
    res.status(500).json({ success: false, message: 'Failed to add agent to queue' });
  }
});

// Remove agent from queue
router.delete('/:id/agents/:extensionId', async (req, res) => {
  try {
    const { id, extensionId } = req.params;
    const tenantId = (req as any).user.tenant_id;
    
    const success = await queueService.removeAgentFromQueue(id, tenantId, extensionId);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Queue or agent not found' });
    }
    
    res.json({ success: true, message: 'Agent removed from queue successfully' });
  } catch (error) {
    console.error('❌ Error removing agent from queue:', error);
    res.status(500).json({ success: false, message: 'Failed to remove agent from queue' });
  }
});

// Update agent status
router.put('/:id/agents/:extensionId/status', async (req, res) => {
  try {
    const { id, extensionId } = req.params;
    const { status, tier_level } = req.body;
    const tenantId = (req as any).user.tenant_id;
    
    const success = await queueService.updateAgentStatus(id, tenantId, extensionId, status, tier_level);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Queue or agent not found' });
    }
    
    res.json({ success: true, message: 'Agent status updated successfully' });
  } catch (error) {
    console.error('❌ Error updating agent status:', error);
    res.status(500).json({ success: false, message: 'Failed to update agent status' });
  }
});

// Get queue statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenant_id;
    
    const stats = await queueService.getQueueStats(id, tenantId);
    if (!stats) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ Error getting queue stats:', error);
    res.status(500).json({ success: false, message: 'Failed to get queue statistics' });
  }
});

// Pause/Resume queue
router.put('/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    const { paused } = req.body;
    const tenantId = (req as any).user.tenant_id;
    
    const success = await queueService.pauseQueue(id, tenantId, paused);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }
    
    res.json({ success: true, message: `Queue ${paused ? 'paused' : 'resumed'} successfully` });
  } catch (error) {
    console.error('❌ Error pausing/resuming queue:', error);
    res.status(500).json({ success: false, message: 'Failed to pause/resume queue' });
  }
});

// Get agent statistics
router.get('/:id/agents/:extensionId/stats', async (req, res) => {
  try {
    const { id, extensionId } = req.params;
    const tenantId = (req as any).user.tenant_id;
    
    const stats = await queueService.getAgentStats(id, tenantId, extensionId);
    if (!stats) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ Error getting agent stats:', error);
    res.status(500).json({ success: false, message: 'Failed to get agent statistics' });
  }
});

export default router;
