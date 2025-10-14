import { Request, Response } from 'express';
import { ContactService } from '../services/ContactService';
import { ContactRepository } from '../repositories/ContactRepository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const contactRepo = new ContactRepository(prisma);
const contactService = new ContactService(contactRepo);

// Helper para respuestas exitosas
const successResponse = (data: any, message?: string) => ({
  success: true,
  message,
  data
});

// Helper para manejar errores async
const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<any>) =>
  (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export class ContactController {
  /**
   * POST /api/contacts
   * Crear nuevo contacto
   */
  static createContact = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const contact = await contactService.createContact(userId, req.body);

    res.status(201).json(
      successResponse(contact, 'Contacto creado exitosamente')
    );
  });

  /**
   * GET /api/contacts
   * Listar todos los contactos del usuario
   */
  static listContacts = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const contacts = await contactService.getUserContacts(userId);

    res.status(200).json(
      successResponse({ contacts, total: contacts.length })
    );
  });

  /**
   * GET /api/contacts/search
   * Buscar contactos
   */
  static searchContacts = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const { q, hasWhatsApp, tag, hasPhone, hasEmail } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required'
      });
    }

    const contacts = await contactService.searchContacts(userId, {
      query: q as string,
      filters: {
        hasWhatsApp: hasWhatsApp === 'true',
        tag: tag as string,
        hasPhone: hasPhone === 'true',
        hasEmail: hasEmail === 'true'
      }
    });

    res.status(200).json(
      successResponse({ contacts, total: contacts.length })
    );
  });

  /**
   * GET /api/contacts/frequent
   * Obtener contactos frecuentes
   */
  static getFrequentContacts = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const contacts = await contactService.getFrequentContacts(userId, limit);

    res.status(200).json(
      successResponse({ contacts })
    );
  });

  /**
   * GET /api/contacts/recent
   * Obtener contactos recientes
   */
  static getRecentContacts = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const contacts = await contactService.getRecentContacts(userId, limit);

    res.status(200).json(
      successResponse({ contacts })
    );
  });

  /**
   * GET /api/contacts/whatsapp
   * Obtener contactos con WhatsApp
   */
  static getWhatsAppContacts = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const contacts = await contactService.getWhatsAppContacts(userId);

    res.status(200).json(
      successResponse({ contacts, total: contacts.length })
    );
  });

  /**
   * GET /api/contacts/tags
   * Obtener todos los tags
   */
  static getAllTags = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const tags = await contactService.getAllTags(userId);

    res.status(200).json(
      successResponse({ tags })
    );
  });

  /**
   * GET /api/contacts/tags/:tag
   * Obtener contactos por tag
   */
  static getContactsByTag = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const { tag } = req.params;

    const contacts = await contactService.getContactsByTag(userId, tag);

    res.status(200).json(
      successResponse({ contacts, total: contacts.length })
    );
  });

  /**
   * GET /api/contacts/stats
   * Obtener estadísticas de contactos
   */
  static getContactStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const stats = await contactService.getContactStats(userId);

    res.status(200).json(
      successResponse({ stats })
    );
  });

  /**
   * GET /api/contacts/:id
   * Obtener contacto por ID
   */
  static getContactById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const contact = await contactService.getContactById(id);

    res.status(200).json(
      successResponse({ contact })
    );
  });

  /**
   * PUT /api/contacts/:id
   * Actualizar contacto
   */
  static updateContact = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const contact = await contactService.updateContact(id, req.body);

    res.status(200).json(
      successResponse({ contact }, 'Contacto actualizado')
    );
  });

  /**
   * DELETE /api/contacts/:id
   * Eliminar contacto
   */
  static deleteContact = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await contactService.deleteContact(id);

    res.status(200).json(
      successResponse(null, 'Contacto eliminado')
    );
  });

  /**
   * POST /api/contacts/:id/tags
   * Agregar tag a contacto
   */
  static addTag = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tag } = req.body;

    if (!tag) {
      return res.status(400).json({
        success: false,
        message: 'Tag is required'
      });
    }

    const contact = await contactService.addTag(id, tag);

    res.status(200).json(
      successResponse({ contact }, 'Tag agregado')
    );
  });

  /**
   * DELETE /api/contacts/:id/tags/:tag
   * Remover tag de contacto
   */
  static removeTag = asyncHandler(async (req: Request, res: Response) => {
    const { id, tag } = req.params;
    const contact = await contactService.removeTag(id, tag);

    res.status(200).json(
      successResponse({ contact }, 'Tag removido')
    );
  });

  /**
   * POST /api/contacts/sync
   * Sincronizar contactos desde dispositivo
   */
  static syncFromDevice = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const { contacts } = req.body;

    if (!Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        message: 'Contacts must be an array'
      });
    }

    const result = await contactService.syncFromDevice(userId, contacts);

    res.status(200).json(
      successResponse(result, `Sincronizados ${result.total} contactos`)
    );
  });

  /**
   * POST /api/contacts/cleanup
   * Limpiar contactos inactivos
   */
  static cleanupInactive = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const { maxAgeDays } = req.body;

    const deleted = await contactService.cleanupInactiveContacts(
      userId,
      maxAgeDays || 180
    );

    res.status(200).json(
      successResponse({ deleted }, `${deleted} contactos eliminados`)
    );
  });
}

export default ContactController;
