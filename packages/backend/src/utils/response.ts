import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '@w3-voip/shared';

// Success response helper
export const successResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date(),
      request_id: res.get('X-Request-ID') || uuidv4(),
      tenant_id: res.get('X-Tenant-ID') || undefined
    }
  };

  if (message) {
    (response as any).message = message;
  }

  res.status(statusCode).json(response);
};

// Error response helper
export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: code || 'INTERNAL_ERROR',
      message,
      details
    },
    meta: {
      timestamp: new Date(),
      request_id: res.get('X-Request-ID') || uuidv4(),
      tenant_id: res.get('X-Tenant-ID') || undefined
    }
  };

  res.status(statusCode).json(response);
};

// Paginated response helper
export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  message?: string
): void => {
  const response: ApiResponse<{
    items: T[];
    pagination: typeof pagination;
  }> = {
    success: true,
    data: {
      items: data,
      pagination
    },
    meta: {
      timestamp: new Date(),
      request_id: res.get('X-Request-ID') || uuidv4(),
      tenant_id: res.get('X-Tenant-ID') || undefined
    }
  };

  if (message) {
    (response as any).message = message;
  }

  res.json(response);
};

// Created response helper
export const createdResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): void => {
  successResponse(res, data, message, 201);
};

// Updated response helper
export const updatedResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Resource updated successfully'
): void => {
  successResponse(res, data, message, 200);
};

// Deleted response helper
export const deletedResponse = (
  res: Response,
  message: string = 'Resource deleted successfully'
): void => {
  successResponse(res, null, message, 200);
};

// Not found response helper
export const notFoundResponse = (
  res: Response,
  message: string = 'Resource not found'
): void => {
  errorResponse(res, message, 404, 'NOT_FOUND');
};

// Unauthorized response helper
export const unauthorizedResponse = (
  res: Response,
  message: string = 'Unauthorized access'
): void => {
  errorResponse(res, message, 401, 'UNAUTHORIZED');
};

// Forbidden response helper
export const forbiddenResponse = (
  res: Response,
  message: string = 'Access forbidden'
): void => {
  errorResponse(res, message, 403, 'FORBIDDEN');
};

// Bad request response helper
export const badRequestResponse = (
  res: Response,
  message: string = 'Bad request',
  details?: any
): void => {
  errorResponse(res, message, 400, 'BAD_REQUEST', details);
};

// Conflict response helper
export const conflictResponse = (
  res: Response,
  message: string = 'Resource conflict'
): void => {
  errorResponse(res, message, 409, 'CONFLICT');
};

// Too many requests response helper
export const tooManyRequestsResponse = (
  res: Response,
  message: string = 'Too many requests'
): void => {
  errorResponse(res, message, 429, 'TOO_MANY_REQUESTS');
};

// Internal server error response helper
export const internalServerErrorResponse = (
  res: Response,
  message: string = 'Internal server error',
  details?: any
): void => {
  errorResponse(res, message, 500, 'INTERNAL_SERVER_ERROR', details);
};

// Service unavailable response helper
export const serviceUnavailableResponse = (
  res: Response,
  message: string = 'Service temporarily unavailable'
): void => {
  errorResponse(res, message, 503, 'SERVICE_UNAVAILABLE');
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error handler middleware
export const errorHandler = (
  error: any,
  req: any,
  res: any,
  next: any
): void => {
  console.error('Error:', error);

  // Default error
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_SERVER_ERROR';
  let details = undefined;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    details = error.details;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
    code = 'FORBIDDEN';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not found';
    code = 'NOT_FOUND';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = 'Conflict';
    code = 'CONFLICT';
  } else if (error.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Too many requests';
    code = 'TOO_MANY_REQUESTS';
  } else if (error.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
  } else if (error.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced resource does not exist';
    code = 'FOREIGN_KEY_VIOLATION';
  } else if (error.code === '23502') { // PostgreSQL not null violation
    statusCode = 400;
    message = 'Required field is missing';
    code = 'NOT_NULL_VIOLATION';
  } else if (error.message) {
    message = error.message;
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
    details = undefined;
  }

  errorResponse(res, message, statusCode, code, details);
};

