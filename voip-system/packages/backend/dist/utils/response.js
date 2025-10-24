"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.asyncHandler = exports.serviceUnavailableResponse = exports.internalServerErrorResponse = exports.tooManyRequestsResponse = exports.conflictResponse = exports.badRequestResponse = exports.forbiddenResponse = exports.unauthorizedResponse = exports.notFoundResponse = exports.deletedResponse = exports.updatedResponse = exports.createdResponse = exports.paginatedResponse = exports.errorResponse = exports.successResponse = void 0;
const uuid_1 = require("uuid");
// Success response helper
const successResponse = (res, data, message, statusCode = 200) => {
    const response = {
        success: true,
        data,
        meta: {
            timestamp: new Date(),
            request_id: res.get('X-Request-ID') || (0, uuid_1.v4)(),
            tenant_id: res.get('X-Tenant-ID') || undefined
        }
    };
    if (message) {
        response.message = message;
    }
    res.status(statusCode).json(response);
};
exports.successResponse = successResponse;
// Error response helper
const errorResponse = (res, message, statusCode = 500, code, details) => {
    const response = {
        success: false,
        error: {
            code: code || 'INTERNAL_ERROR',
            message,
            details
        },
        meta: {
            timestamp: new Date(),
            request_id: res.get('X-Request-ID') || (0, uuid_1.v4)(),
            tenant_id: res.get('X-Tenant-ID') || undefined
        }
    };
    res.status(statusCode).json(response);
};
exports.errorResponse = errorResponse;
// Paginated response helper
const paginatedResponse = (res, data, pagination, message) => {
    const response = {
        success: true,
        data: {
            items: data,
            pagination
        },
        meta: {
            timestamp: new Date(),
            request_id: res.get('X-Request-ID') || (0, uuid_1.v4)(),
            tenant_id: res.get('X-Tenant-ID') || undefined
        }
    };
    if (message) {
        response.message = message;
    }
    res.json(response);
};
exports.paginatedResponse = paginatedResponse;
// Created response helper
const createdResponse = (res, data, message = 'Resource created successfully') => {
    (0, exports.successResponse)(res, data, message, 201);
};
exports.createdResponse = createdResponse;
// Updated response helper
const updatedResponse = (res, data, message = 'Resource updated successfully') => {
    (0, exports.successResponse)(res, data, message, 200);
};
exports.updatedResponse = updatedResponse;
// Deleted response helper
const deletedResponse = (res, message = 'Resource deleted successfully') => {
    (0, exports.successResponse)(res, null, message, 200);
};
exports.deletedResponse = deletedResponse;
// Not found response helper
const notFoundResponse = (res, message = 'Resource not found') => {
    (0, exports.errorResponse)(res, message, 404, 'NOT_FOUND');
};
exports.notFoundResponse = notFoundResponse;
// Unauthorized response helper
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
    (0, exports.errorResponse)(res, message, 401, 'UNAUTHORIZED');
};
exports.unauthorizedResponse = unauthorizedResponse;
// Forbidden response helper
const forbiddenResponse = (res, message = 'Access forbidden') => {
    (0, exports.errorResponse)(res, message, 403, 'FORBIDDEN');
};
exports.forbiddenResponse = forbiddenResponse;
// Bad request response helper
const badRequestResponse = (res, message = 'Bad request', details) => {
    (0, exports.errorResponse)(res, message, 400, 'BAD_REQUEST', details);
};
exports.badRequestResponse = badRequestResponse;
// Conflict response helper
const conflictResponse = (res, message = 'Resource conflict') => {
    (0, exports.errorResponse)(res, message, 409, 'CONFLICT');
};
exports.conflictResponse = conflictResponse;
// Too many requests response helper
const tooManyRequestsResponse = (res, message = 'Too many requests') => {
    (0, exports.errorResponse)(res, message, 429, 'TOO_MANY_REQUESTS');
};
exports.tooManyRequestsResponse = tooManyRequestsResponse;
// Internal server error response helper
const internalServerErrorResponse = (res, message = 'Internal server error', details) => {
    (0, exports.errorResponse)(res, message, 500, 'INTERNAL_SERVER_ERROR', details);
};
exports.internalServerErrorResponse = internalServerErrorResponse;
// Service unavailable response helper
const serviceUnavailableResponse = (res, message = 'Service temporarily unavailable') => {
    (0, exports.errorResponse)(res, message, 503, 'SERVICE_UNAVAILABLE');
};
exports.serviceUnavailableResponse = serviceUnavailableResponse;
// Async error handler wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// Error handler middleware
const errorHandler = (error, req, res, next) => {
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
    }
    else if (error.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
        code = 'UNAUTHORIZED';
    }
    else if (error.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Forbidden';
        code = 'FORBIDDEN';
    }
    else if (error.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Not found';
        code = 'NOT_FOUND';
    }
    else if (error.name === 'ConflictError') {
        statusCode = 409;
        message = 'Conflict';
        code = 'CONFLICT';
    }
    else if (error.name === 'RateLimitError') {
        statusCode = 429;
        message = 'Too many requests';
        code = 'TOO_MANY_REQUESTS';
    }
    else if (error.code === '23505') { // PostgreSQL unique violation
        statusCode = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_RESOURCE';
    }
    else if (error.code === '23503') { // PostgreSQL foreign key violation
        statusCode = 400;
        message = 'Referenced resource does not exist';
        code = 'FOREIGN_KEY_VIOLATION';
    }
    else if (error.code === '23502') { // PostgreSQL not null violation
        statusCode = 400;
        message = 'Required field is missing';
        code = 'NOT_NULL_VIOLATION';
    }
    else if (error.message) {
        message = error.message;
    }
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Internal server error';
        details = undefined;
    }
    (0, exports.errorResponse)(res, message, statusCode, code, details);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=response.js.map