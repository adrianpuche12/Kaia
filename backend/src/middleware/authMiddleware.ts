// Middleware de autenticación JWT
import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../utils/jwt';
import { errorResponse } from '../utils/helpers';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { logger } from '../utils/logger';

/**
 * Middleware que verifica la presencia y validez del JWT
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(ERROR_CODES.UNAUTHORIZED, 'Token no proporcionado')
      );
    }

    // Formato esperado: "Bearer <token>"
    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(ERROR_CODES.UNAUTHORIZED, 'Formato de token inválido')
      );
    }

    // Verificar token
    try {
      const payload = JWTService.verifyToken(token);

      // Validar que sea un access token
      if (payload.type !== 'access') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          errorResponse(ERROR_CODES.UNAUTHORIZED, 'Tipo de token inválido')
        );
      }

      // Agregar información del usuario al request
      (req as any).user = {
        id: payload.userId,
        email: payload.email,
      };

      next();
    } catch (error: any) {
      if (error.message === 'TOKEN_EXPIRED') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          errorResponse(ERROR_CODES.TOKEN_EXPIRED, 'Token expirado')
        );
      }

      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(ERROR_CODES.TOKEN_INVALID, 'Token inválido')
      );
    }
  } catch (error) {
    logger.error('Error en middleware de autenticación', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Error de autenticación')
    );
  }
}

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  try {
    const [bearer, token] = authHeader.split(' ');

    if (bearer === 'Bearer' && token) {
      const payload = JWTService.verifyToken(token);

      if (payload.type === 'access') {
        (req as any).user = {
          id: payload.userId,
          email: payload.email,
        };
      }
    }
  } catch (error) {
    // Ignora errores en auth opcional
  }

  next();
}

export default {
  authenticate,
  optionalAuth,
};
