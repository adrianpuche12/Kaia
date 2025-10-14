// Controlador de autenticación
import { Request, Response } from 'express';
import { AuthService } from '../services/auth/authService';
import { successResponse } from '../utils/helpers';
import { asyncHandler } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../config/constants';

export class AuthController {
  /**
   * POST /api/auth/register
   * Registra un nuevo usuario
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(result, 'Usuario registrado exitosamente')
    );
  });

  /**
   * POST /api/auth/login
   * Inicia sesión
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);

    res.status(HTTP_STATUS.OK).json(
      successResponse(result, 'Login exitoso')
    );
  });

  /**
   * POST /api/auth/refresh
   * Refresca el access token
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const tokens = await AuthService.refreshToken(refreshToken);

    res.status(HTTP_STATUS.OK).json(
      successResponse({ tokens }, 'Token refrescado')
    );
  });

  /**
   * GET /api/auth/profile
   * Obtiene perfil del usuario autenticado
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;

    const user = await AuthService.getProfile(userId);

    res.status(HTTP_STATUS.OK).json(
      successResponse({ user })
    );
  });

  /**
   * PUT /api/auth/profile
   * Actualiza perfil del usuario
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;

    const user = await AuthService.updateProfile(userId, req.body);

    res.status(HTTP_STATUS.OK).json(
      successResponse({ user }, 'Perfil actualizado')
    );
  });

  /**
   * POST /api/auth/change-password
   * Cambia la contraseña del usuario
   */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const { currentPassword, newPassword } = req.body;

    await AuthService.changePassword(userId, currentPassword, newPassword);

    res.status(HTTP_STATUS.OK).json(
      successResponse(null, 'Contraseña actualizada')
    );
  });

  /**
   * DELETE /api/auth/account
   * Elimina la cuenta del usuario
   */
  static deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;

    await AuthService.deleteAccount(userId);

    res.status(HTTP_STATUS.OK).json(
      successResponse(null, 'Cuenta eliminada')
    );
  });
}

export default AuthController;
