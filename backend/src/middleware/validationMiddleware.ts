// Middleware de validación con Zod
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { errorResponse } from '../utils/helpers';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

/**
 * Valida el body del request contra un schema de Zod
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valida y parsea el body
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      // Los errores de Zod serán capturados por el errorHandler global
      next(error);
    }
  };
}

/**
 * Valida los query params contra un schema de Zod
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Valida los params de la URL contra un schema de Zod
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Valida que un ID sea válido (formato cuid)
 */
export function validateId(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];

    if (!id || typeof id !== 'string' || id.length < 10) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        errorResponse(ERROR_CODES.VALIDATION_ERROR, `ID inválido: ${paramName}`)
      );
    }

    next();
  };
}

export default {
  validateBody,
  validateQuery,
  validateParams,
  validateId,
};
