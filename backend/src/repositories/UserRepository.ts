import { PrismaClient, User } from '@prisma/client';
import { BaseRepository } from './base/BaseRepository';

/**
 * Datos para crear un usuario
 */
export interface UserCreateData {
  email: string;
  password: string;
  name: string;
  lastName?: string;
  phone?: string;
  birthDate?: Date;
}

/**
 * Datos para actualizar un usuario
 */
export interface UserUpdateData {
  name?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  birthDate?: Date;
  avatar?: string;
  onboardingCompleted?: boolean;
}

/**
 * Filtros para búsqueda de usuarios
 */
export interface UserFilters {
  email?: string;
  name?: string;
  onboardingCompleted?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * UserRepository
 * Gestiona todas las operaciones CRUD de usuarios
 * Extiende BaseRepository para integración con sistema de IA
 */
export class UserRepository extends BaseRepository<User> {
  /**
   * Crear un nuevo usuario
   * @param data Datos del usuario
   * @returns Usuario creado
   */
  async create(data: UserCreateData): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        lastName: data.lastName,
        phone: data.phone,
        birthDate: data.birthDate,
        onboardingCompleted: false,
      },
    });

    // Notificar a observers
    await this.notifyObservers({
      type: 'CREATE',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      data: user,
      timestamp: new Date(),
    });

    return user;
  }

  /**
   * Buscar usuario por ID
   * @param id ID del usuario
   * @returns Usuario o null
   */
  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
      },
    });
  }

  /**
   * Buscar usuario por email
   * @param email Email del usuario
   * @returns Usuario o null
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
      include: {
        preferences: true,
      },
    });
  }

  /**
   * Actualizar usuario
   * @param id ID del usuario
   * @param data Datos a actualizar
   * @returns Usuario actualizado
   */
  async update(id: string, data: UserUpdateData): Promise<User> {
    // Filtrar solo campos definidos
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) updateData.password = data.password;
    if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
      updateData.phone = data.phone;
    }
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.onboardingCompleted !== undefined) {
      updateData.onboardingCompleted = data.onboardingCompleted;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Notificar a observers
    await this.notifyObservers({
      type: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      data: user,
      timestamp: new Date(),
    });

    return user;
  }

  /**
   * Eliminar usuario (hard delete)
   * @param id ID del usuario
   */
  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });

    // Notificar a observers
    await this.notifyObservers({
      type: 'DELETE',
      entityType: 'USER',
      entityId: id,
      userId: id,
      data: null,
      timestamp: new Date(),
    });
  }

  /**
   * Buscar múltiples usuarios con filtros
   * @param filters Filtros de búsqueda
   * @returns Array de usuarios
   */
  async findMany(filters: UserFilters): Promise<User[]> {
    const where: any = {};

    if (filters.email) where.email = { contains: filters.email };
    if (filters.name) where.name = { contains: filters.name };
    if (filters.onboardingCompleted !== undefined) {
      where.onboardingCompleted = filters.onboardingCompleted;
    }
    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};
      if (filters.createdAfter) where.createdAt.gte = filters.createdAfter;
      if (filters.createdBefore) where.createdAt.lte = filters.createdBefore;
    }

    return await this.prisma.user.findMany({
      where,
      include: {
        preferences: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Completar onboarding de usuario
   * @param userId ID del usuario
   * @param profileData Datos adicionales del perfil
   * @returns Usuario actualizado
   */
  async completeOnboarding(
    userId: string,
    profileData: Partial<UserUpdateData>
  ): Promise<User> {
    return await this.update(userId, {
      ...profileData,
      onboardingCompleted: true,
    });
  }

  /**
   * Verificar si un email ya existe
   * @param email Email a verificar
   * @returns true si existe, false si no
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  /**
   * Contar usuarios totales
   * @returns Número de usuarios
   */
  async countAll(): Promise<number> {
    return await this.prisma.user.count();
  }

  /**
   * Obtener usuarios que completaron onboarding
   * @returns Array de usuarios
   */
  async findOnboardingCompleted(): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: {
        onboardingCompleted: true,
      },
      include: {
        preferences: true,
      },
    });
  }

  /**
   * Obtener usuarios pendientes de onboarding
   * @returns Array de usuarios
   */
  async findOnboardingPending(): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: {
        onboardingCompleted: false,
      },
    });
  }
}
