// Utilidades para manejo de JWT
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JWTPayload, TokenPair } from '../types';

export class JWTService {
  /**
   * Genera un par de tokens (access + refresh)
   */
  static generateTokenPair(userId: string, email: string): TokenPair {
    const accessToken = this.generateAccessToken(userId, email);
    const refreshToken = this.generateRefreshToken(userId, email);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos en segundos
    };
  }

  /**
   * Genera un access token
   */
  static generateAccessToken(userId: string, email: string): string {
    const payload: JWTPayload = {
      userId,
      email,
      type: 'access',
    };

    return jwt.sign(payload, config.jwtSecret as any, {
      expiresIn: config.jwtExpiresIn,
    } as any);
  }

  /**
   * Genera un refresh token
   */
  static generateRefreshToken(userId: string, email: string): string {
    const payload: JWTPayload = {
      userId,
      email,
      type: 'refresh',
    };

    return jwt.sign(payload, config.jwtSecret as any, {
      expiresIn: config.jwtRefreshExpiresIn,
    } as any);
  }

  /**
   * Verifica y decodifica un token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TOKEN_EXPIRED');
      }
      throw new Error('TOKEN_INVALID');
    }
  }

  /**
   * Decodifica un token sin verificar (útil para debugging)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}

export default JWTService;
