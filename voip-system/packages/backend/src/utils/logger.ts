import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to use based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
  
  // Error log file
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
  }),
  
  // Combined log file
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
  }),
  
  // Security events log file
  new DailyRotateFile({
    filename: path.join(logsDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'warn',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '30d', // Keep security logs longer
  }),
  
  // API access log file
  new DailyRotateFile({
    filename: path.join(logsDir, 'api-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '7d',
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

// Create specialized loggers for different components
export const securityLogger = winston.createLogger({
  level: 'info',
  levels,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.label({ label: 'SECURITY' }),
        winston.format.printf(
          (info) => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`
        )
      ),
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

export const apiLogger = winston.createLogger({
  level: 'http',
  levels,
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'api-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '7d',
    }),
  ],
});

export const cdrLogger = winston.createLogger({
  level: 'info',
  levels,
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'cdr-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '50m',
      maxFiles: '90d', // Keep CDR logs for 3 months
    }),
  ],
});

export const freeswitchLogger = winston.createLogger({
  level: 'info',
  levels,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.label({ label: 'FREESWITCH' }),
        winston.format.printf(
          (info) => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`
        )
      ),
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'freeswitch-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// Logging middleware for Express
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      tenantId: req.tenantId,
      userId: req.user?.sub,
      requestId: req.id,
    };
    
    if (res.statusCode >= 400) {
      apiLogger.warn('API Request', logData);
    } else {
      apiLogger.http('API Request', logData);
    }
  });
  
  next();
};

// Security event logger
export const logSecurityEvent = (event: string, details: any, req?: any) => {
  const logData = {
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: req?.ip,
    userAgent: req?.headers['user-agent'],
    tenantId: req?.tenantId,
    userId: req?.user?.sub,
    requestId: req?.id,
  };
  
  securityLogger.warn('Security Event', logData);
};

// CDR event logger
export const logCDREvent = (event: string, cdrData: any) => {
  const logData = {
    event,
    cdr: cdrData,
    timestamp: new Date().toISOString(),
  };
  
  cdrLogger.info('CDR Event', logData);
};

// FreeSWITCH event logger
export const logFreeSWITCHEvent = (event: string, data: any) => {
  const logData = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };
  
  freeswitchLogger.info('FreeSWITCH Event', logData);
};

export default logger;

