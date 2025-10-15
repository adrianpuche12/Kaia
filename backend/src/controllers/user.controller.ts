// Controlador de usuario y preferencias
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse } from '../utils/helpers';
import { asyncHandler } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../config/constants';

const prisma = new PrismaClient();

export class UserController {
  /**
   * POST /api/users/onboarding
   * Completa el onboarding del usuario
   */
  static completeOnboarding = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { phone, address, city, country, birthDate, interests, favoriteCategories, notificationsEnabled, locationEnabled } = req.body;

    // Actualizar usuario con datos de onboarding
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
        ...(phone && { phone }),
        ...(address && { address }),
        ...(city && { city }),
        ...(country && { country }),
        ...(birthDate && { birthDate: new Date(birthDate) }),
      },
    });

    // Actualizar preferencias si se proporcionaron
    if (notificationsEnabled !== undefined || locationEnabled !== undefined) {
      await prisma.userPreferences.update({
        where: { userId },
        data: {
          ...(notificationsEnabled !== undefined && { pushEnabled: notificationsEnabled }),
          ...(locationEnabled !== undefined && { locationTrackingEnabled: locationEnabled }),
        },
      });
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse({ success: true, user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName || undefined,
        phone: user.phone || undefined,
        birthDate: user.birthDate || undefined,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt,
      } }, 'Onboarding completado exitosamente')
    );
  });

  /**
   * GET /api/users/preferences
   */
  static getPreferences = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    res.status(HTTP_STATUS.OK).json(
      successResponse({ preferences })
    );
  });

  /**
   * PUT /api/users/preferences
   */
  static updatePreferences = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...req.body,
      },
      update: req.body,
    });

    res.status(HTTP_STATUS.OK).json(
      successResponse({ preferences }, 'Preferencias actualizadas')
    );
  });

  /**
   * GET /api/users/contacts
   */
  static listContacts = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const searchQuery = req.query.q as string;

    const where: any = { userId };

    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery } },
        { email: { contains: searchQuery } },
        { phone: { contains: searchQuery } },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.status(HTTP_STATUS.OK).json(
      successResponse({ contacts })
    );
  });

  /**
   * POST /api/users/contacts
   */
  static createContact = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const contact = await prisma.contact.create({
      data: {
        userId,
        ...req.body,
      },
    });

    res.status(HTTP_STATUS.CREATED).json(
      successResponse({ contact }, 'Contacto creado')
    );
  });

  /**
   * GET /api/users/contacts/:id
   */
  static getContactById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: { id, userId },
    });

    if (!contact) {
      throw {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Contacto no encontrado',
      };
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse({ contact })
    );
  });

  /**
   * PUT /api/users/contacts/:id
   */
  static updateContact = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: { id, userId },
    });

    if (!contact) {
      throw {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Contacto no encontrado',
      };
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: req.body,
    });

    res.status(HTTP_STATUS.OK).json(
      successResponse({ contact: updated }, 'Contacto actualizado')
    );
  });

  /**
   * DELETE /api/users/contacts/:id
   */
  static deleteContact = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: { id, userId },
    });

    if (!contact) {
      throw {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Contacto no encontrado',
      };
    }

    await prisma.contact.delete({ where: { id } });

    res.status(HTTP_STATUS.OK).json(
      successResponse(null, 'Contacto eliminado')
    );
  });
}

export default UserController;
