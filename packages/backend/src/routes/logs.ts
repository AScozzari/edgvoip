// @ts-nocheck
import express from 'express';
import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const router = express.Router();

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  component: string;
  message: string;
  tenant_id?: string;
  source: 'freeswitch' | 'backend' | 'frontend';
}

// Get FreeSWITCH logs
router.get('/freeswitch', async (req: Request, res: Response) => {
  try {
    const { lines = '100', level = 'all', component = 'all' } = req.query;
    
    // Check if FreeSWITCH container is running
    try {
      await execAsync('docker ps --filter name=voip_freeswitch --format "{{.Names}}"');
    } catch (error) {
      return res.status(503).json({
        error: 'FreeSWITCH container is not running',
        message: 'Please start FreeSWITCH container first'
      });
    }

    // Get FreeSWITCH logs from Docker container
    const logCommand = `docker logs voip_freeswitch --tail ${lines}`;
    const { stdout } = await execAsync(logCommand);
    
    // Parse logs and convert to structured format
    const logLines = stdout.split('\n').filter(line => line.trim());
    const parsedLogs: LogEntry[] = [];
    
    logLines.forEach((line, index) => {
      // Parse FreeSWITCH log format: [timestamp] level component message
      const match = line.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\] (\w+)\s+(.+)/);
      
      if (match) {
        const [, timestamp, level, rest] = match;
        const componentMatch = rest.match(/^([a-zA-Z_]+)\s+(.+)/);
        
        if (componentMatch) {
          const [, component, message] = componentMatch;
          
          const logEntry: LogEntry = {
            id: `fs-${Date.now()}-${index}`,
            timestamp: new Date(timestamp).toISOString(),
            level: (level.toUpperCase() as any) || 'INFO',
            component: component || 'unknown',
            message: message || rest,
            source: 'freeswitch'
          };
          
          // Apply filters
          if (level === 'all' || logEntry.level === level.toUpperCase()) {
            if (component === 'all' || logEntry.component === component) {
              parsedLogs.push(logEntry);
            }
          }
        }
      }
    });
    
    res.json({
      success: true,
      logs: parsedLogs,
      total: parsedLogs.length,
      source: 'freeswitch',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching FreeSWITCH logs:', error);
    res.status(500).json({
      error: 'Failed to fetch FreeSWITCH logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get backend logs
router.get('/backend', async (req: Request, res: Response) => {
  try {
    const { lines = '100', level = 'all' } = req.query;
    
    // For now, return sample backend logs
    // In production, this would read from actual log files
    const sampleLogs: LogEntry[] = [
      {
        id: `be-${Date.now()}-1`,
        timestamp: new Date().toISOString(),
        level: 'INFO',
        component: 'api',
        message: 'Server started successfully on port 3000',
        source: 'backend'
      },
      {
        id: `be-${Date.now()}-2`,
        timestamp: new Date(Date.now() - 1000).toISOString(),
        level: 'INFO',
        component: 'auth',
        message: 'User authentication successful',
        source: 'backend'
      },
      {
        id: `be-${Date.now()}-3`,
        timestamp: new Date(Date.now() - 2000).toISOString(),
        level: 'DEBUG',
        component: 'database',
        message: 'Database connection established',
        source: 'backend'
      }
    ];
    
    // Apply level filter
    const filteredLogs = level === 'all' 
      ? sampleLogs 
      : sampleLogs.filter(log => log.level === level.toUpperCase());
    
    res.json({
      success: true,
      logs: filteredLogs,
      total: filteredLogs.length,
      source: 'backend',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching backend logs:', error);
    res.status(500).json({
      error: 'Failed to fetch backend logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get system logs (combined)
router.get('/system', async (req: Request, res: Response) => {
  try {
    const { lines = '50' } = req.query;
    
    // Get logs from multiple sources
    const [freeswitchResponse, backendResponse] = await Promise.allSettled([
      fetch(`http://192.168.172.234:${process.env.PORT || 3000}/api/logs/freeswitch?lines=${lines}`),
      fetch(`http://192.168.172.234:${process.env.PORT || 3000}/api/logs/backend?lines=${lines}`)
    ]);
    
    const allLogs: LogEntry[] = [];
    
    if (freeswitchResponse.status === 'fulfilled' && freeswitchResponse.value.ok) {
      const fsData = await freeswitchResponse.value.json();
      if (fsData.success) {
        allLogs.push(...fsData.logs);
      }
    }
    
    if (backendResponse.status === 'fulfilled' && backendResponse.value.ok) {
      const beData = await backendResponse.value.json();
      if (beData.success) {
        allLogs.push(...beData.logs);
      }
    }
    
    // Sort by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json({
      success: true,
      logs: allLogs,
      total: allLogs.length,
      sources: ['freeswitch', 'backend'],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({
      error: 'Failed to fetch system logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get log statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get recent logs to calculate stats
    const { lines = '1000' } = req.query;
    
    const [freeswitchResponse, backendResponse] = await Promise.allSettled([
      fetch(`http://192.168.172.234:${process.env.PORT || 3000}/api/logs/freeswitch?lines=${lines}`),
      fetch(`http://192.168.172.234:${process.env.PORT || 3000}/api/logs/backend?lines=${lines}`)
    ]);
    
    let totalLogs = 0;
    let errorCount = 0;
    let warningCount = 0;
    
    if (freeswitchResponse.status === 'fulfilled' && freeswitchResponse.value.ok) {
      const fsData = await freeswitchResponse.value.json();
      if (fsData.success) {
        totalLogs += fsData.logs.length;
        errorCount += fsData.logs.filter((log: LogEntry) => 
          log.level === 'ERROR' || log.level === 'CRITICAL'
        ).length;
        warningCount += fsData.logs.filter((log: LogEntry) => 
          log.level === 'WARN'
        ).length;
      }
    }
    
    if (backendResponse.status === 'fulfilled' && backendResponse.value.ok) {
      const beData = await backendResponse.value.json();
      if (beData.success) {
        totalLogs += beData.logs.length;
        errorCount += beData.logs.filter((log: LogEntry) => 
          log.level === 'ERROR' || log.level === 'CRITICAL'
        ).length;
        warningCount += beData.logs.filter((log: LogEntry) => 
          log.level === 'WARN'
        ).length;
      }
    }
    
    res.json({
      success: true,
      stats: {
        total: totalLogs,
        errors: errorCount,
        warnings: warningCount,
        last_update: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching log statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch log statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Set FreeSWITCH log level
router.post('/freeswitch/level', async (req: Request, res: Response) => {
  try {
    const { level } = req.body;
    
    if (!level || !['debug', 'info', 'notice', 'warning', 'error'].includes(level)) {
      return res.status(400).json({
        error: 'Invalid log level',
        message: 'Level must be one of: debug, info, notice, warning, error'
      });
    }
    
    // Execute FreeSWITCH command to set log level
    const command = `docker exec voip_freeswitch fs_cli -x "console loglevel ${level}"`;
    await execAsync(command);
    
    res.json({
      success: true,
      message: `FreeSWITCH log level set to ${level}`,
      level: level,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error setting FreeSWITCH log level:', error);
    res.status(500).json({
      error: 'Failed to set FreeSWITCH log level',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Enable/disable SIP tracing
router.post('/freeswitch/tracing', async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: 'enabled must be a boolean value'
      });
    }
    
    // Execute FreeSWITCH command to enable/disable SIP tracing
    const command = `docker exec voip_freeswitch fs_cli -x "sofia loglevel ${enabled ? 'all' : 'info'}"`;
    await execAsync(command);
    
    res.json({
      success: true,
      message: `SIP tracing ${enabled ? 'enabled' : 'disabled'}`,
      enabled: enabled,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error setting SIP tracing:', error);
    res.status(500).json({
      error: 'Failed to set SIP tracing',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
