// Servicio de autenticación
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../../utils/helpers';
import { JWTService } from '../../utils/jwt';
import { RegisterDTO, LoginDTO, TokenPair, UserDTO } from '../../types';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Registra un nuevo usuario
   */
  static async register(data: RegisterDTO): Promise<{ user: UserDTO; tokens: TokenPair }> {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw {
        statusCode: 409,
        code: 'ALREADY_EXISTS',
        message: 'El email ya está registrado',
      };
    }

    // Verificar si el teléfono ya existe (si se proporcionó)
    if (data.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: data.phone },
      });

      if (existingPhone) {
        throw {
          statusCode: 409,
          code: 'ALREADY_EXISTS',
          message: 'El teléfono ya está registrado',
        };
      }
    }

    // Hashear password
    const hashedPassword = await hashPassword(data.password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        lastName: data.lastName,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      },
    });

    // Crear preferencias por defecto
    await prisma.userPreferences.create({
      data: {
        userId: user.id,
      },
    });

    // Generar tokens
    const tokens = JWTService.generateTokenPair(user.id, user.email);

    // Log
    logger.authEvent(user.id, 'register', true);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Login de usuario
   */
  static async login(data: LoginDTO): Promise<{ user: UserDTO; tokens: TokenPair }> {
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { preferences: true },
    });

    if (!user) {
      throw {
        statusCode: 401,
        code: 'INVALID_EMAIL',
        message: 'El email no está registrado',
      };
    }

    // Verificar password
    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw {
        statusCode: 401,
        code: 'INVALID_PASSWORD',
        message: 'Contraseña incorrecta',
      };
    }

    // Generar tokens
    const tokens = JWTService.generateTokenPair(user.id, user.email);

    // Log
    logger.authEvent(user.id, 'login', true);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verificar refresh token
      const payload = JWTService.verifyToken(refreshToken);

      if (payload.type !== 'refresh') {
        throw new Error('TOKEN_INVALID');
      }

      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Generar nuevos tokens
      return JWTService.generateTokenPair(user.id, user.email);
    } catch (error: any) {
      throw {
        statusCode: 401,
        code: error.message || 'TOKEN_INVALID',
        message: 'Token inválido o expirado',
      };
    }
  }

  /**
   * Obtener perfil de usuario
   */
  static async getProfile(userId: string): Promise<UserDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });

    if (!user) {
      throw {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Usuario no encontrado',
      };
    }

    return this.sanitizeUser(user);
  }

  /**
   * Actualizar perfil de usuario
   */
  static async updateProfile(
    userId: string,
    data: Partial<RegisterDTO>
  ): Promise<UserDTO> {
    // Si se actualiza el email, verificar que no esté en uso
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw {
          statusCode: 409,
          code: 'ALREADY_EXISTS',
          message: 'El email ya está en uso',
        };
      }
    }

    // Si se actualiza el teléfono, verificar que no esté en uso
    if (data.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          NOT: { id: userId },
        },
      });

      if (existingPhone) {
        throw {
          statusCode: 409,
          code: 'ALREADY_EXISTS',
          message: 'El teléfono ya está en uso',
        };
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.birthDate && { birthDate: new Date(data.birthDate) }),
      },
    });

    return this.sanitizeUser(user);
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Usuario no encontrado',
      };
    }

    // Verificar contraseña actual
    const isValid = await comparePassword(currentPassword, user.password);

    if (!isValid) {
      throw {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Contraseña actual incorrecta',
      };
    }

    // Actualizar contraseña
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info('Password changed', { userId });
  }

  /**
   * Eliminar cuenta
   */
  static async deleteAccount(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info('Account deleted', { userId });
  }

  /**
   * Sanitiza datos del usuario (remueve password)
   */
  private static sanitizeUser(user: any): UserDTO {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      lastName: user.lastName || undefined,
      phone: user.phone || undefined,
      birthDate: user.birthDate || undefined,
      onboardingCompleted: user.onboardingCompleted || false,
      createdAt: user.createdAt,
    };
  }
}

export default AuthService;
