import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Mock CDR statistics endpoint
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Return mock statistics
    const mockStats = {
      success: true,
      data: {
        total_calls: 0,
        answered_calls: 0,
        missed_calls: 0,
        total_duration: 0,
        average_duration: 0,
        inbound_calls: 0,
        outbound_calls: 0,
        internal_calls: 0,
      }
    };
    
    res.json(mockStats);
  } catch (error) {
    console.error('Error fetching CDR stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CDR statistics'
    });
  }
});

// Mock CDR list endpoint
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        items: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching CDR records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CDR records'
    });
  }
});

export default router;
