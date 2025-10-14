// Middleware de manejo de errores global
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { errorResponse } from '../utils/helpers';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { logger } from '../utils/logger';

/**
 * Maneja errores de Zod (validación)
 */
function handleZodError(error: ZodError) {
  const details = error.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    status: HTTP_STATUS.BAD_REQUEST,
    response: errorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      'Error de validación',
      details
    ),
  };
}

/**
 * Maneja errores de Prisma
 */
function handlePrismaError(error: any) {
  // Record not found
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      return {
        status: HTTP_STATUS.NOT_FOUND,
        response: errorResponse(
          ERROR_CODES.NOT_FOUND,
          'Recurso no encontrado'
        ),
      };
    }

    // Unique constraint violation
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.join(', ') || 'campo';
      return {
        status: HTTP_STATUS.CONFLICT,
        response: errorResponse(
          ERROR_CODES.ALREADY_EXISTS,
          `Ya existe un registro con ese ${field}`
        ),
      };
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return {
        status: HTTP_STATUS.BAD_REQUEST,
        response: errorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          'Referencia inválida a otro recurso'
        ),
      };
    }
  }

  // Error de conexión a BD
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: HTTP_STATUS.SERVICE_UNAVAILABLE,
      response: errorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Error de conexión a base de datos'
      ),
    };
  }

  return null;
}

/**
 * Maneja errores personalizados de la aplicación
 */
function handleAppError(error: any) {
  // Error con código de estado y mensaje
  if (error.statusCode && error.message) {
    return {
      status: error.statusCode,
      response: errorResponse(
        error.code || ERROR_CODES.OPERATION_FAILED,
        error.message,
        error.details
      ),
    };
  }

  return null;
}

/**
 * Middleware principal de manejo de errores
 */
export function errorHandler(
  error: Error | any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log del error
  logger.error('Error capturado por errorHandler', error, {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
  });

  // Manejar errores específicos
  let handled = null;

  // Zod validation errors
  if (error instanceof ZodError) {
    handled = handleZodError(error);
  }

  // Prisma errors
  if (!handled && error.name?.startsWith('Prisma')) {
    handled = handlePrismaError(error);
  }

  // App-specific errors
  if (!handled) {
    handled = handleAppError(error);
  }

  // Error por defecto
  if (!handled) {
    handled = {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      response: errorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Error interno del servidor'
      ),
    };
  }

  res.status(handled.status).json(handled.response);
}

/**
 * Middleware para rutas no encontradas (404)
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(HTTP_STATUS.NOT_FOUND).json(
    errorResponse(
      ERROR_CODES.NOT_FOUND,
      `Ruta no encontrada: ${req.method} ${req.path}`
    )
  );
}

/**
 * Wrapper para funciones async en controllers
 * Captura errores y los pasa al errorHandler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
