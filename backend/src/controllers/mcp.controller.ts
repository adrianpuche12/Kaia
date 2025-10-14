import { Request, Response } from 'express';
import { MCPService } from '../services/MCPService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const mcpService = new MCPService(prisma);

const successResponse = (data: any, message?: string) => ({ success: true, message, data });
const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<any>) =>
  (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export class MCPController {
  /**
   * POST /api/mcps - Registrar nuevo MCP
   */
  static registerMCP = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const mcp = await mcpService.registerMCP({ ...req.body, createdBy: userId });

    res.status(201).json(successResponse(mcp, 'MCP registrado'));
  });

  /**
   * GET /api/mcps - Listar MCPs
   */
  static listMCPs = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const type = req.query.type as any;
    const category = req.query.category as string;
    const enabled = req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined;

    const mcps = await mcpService.listMCPs({ type, category, enabled, userId });

    res.status(200).json(successResponse({ mcps, total: mcps.length }));
  });

  /**
   * GET /api/mcps/recommended - MCPs recomendados
   */
  static getRecommendedMCPs = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const category = req.query.category as string;
    const recentIntent = req.query.recentIntent as string;

    const mcps = await mcpService.getRecommendedMCPs(userId, { category, recentIntent });

    res.status(200).json(successResponse({ mcps }));
  });

  /**
   * GET /api/mcps/capability/:capability - Buscar por capacidad
   */
  static findByCapability = asyncHandler(async (req: Request, res: Response) => {
    const { capability } = req.params;
    const mcps = await mcpService.findMCPsByCapability(capability);

    res.status(200).json(successResponse({ mcps, total: mcps.length }));
  });

  /**
   * GET /api/mcps/:id - Obtener MCP por ID
   */
  static getMCPById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const mcp = await mcpService.getMCPById(id);

    res.status(200).json(successResponse({ mcp }));
  });

  /**
   * PUT /api/mcps/:id - Actualizar MCP
   */
  static updateMCP = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const mcp = await mcpService.updateMCP(id, req.body);

    res.status(200).json(successResponse({ mcp }, 'MCP actualizado'));
  });

  /**
   * DELETE /api/mcps/:id - Eliminar MCP
   */
  static deleteMCP = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await mcpService.deleteMCP(id);

    res.status(200).json(successResponse(null, 'MCP eliminado'));
  });

  /**
   * POST /api/mcps/:id/toggle - Habilitar/deshabilitar MCP
   */
  static toggleMCP = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Enabled must be a boolean'
      });
    }

    const mcp = await mcpService.toggleMCP(id, enabled);

    res.status(200).json(successResponse({ mcp }, `MCP ${enabled ? 'habilitado' : 'deshabilitado'}`));
  });

  /**
   * POST /api/mcps/execute - Ejecutar MCP
   */
  static executeMCP = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const result = await mcpService.executeMCP(req.body);

    res.status(200).json(successResponse(result));
  });

  /**
   * GET /api/mcps/executions/history - Historial de ejecuciones
   */
  static getExecutionHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const history = await mcpService.getExecutionHistory(userId, limit);

    res.status(200).json(successResponse({ history, total: history.length }));
  });

  /**
   * GET /api/mcps/stats - Estadísticas generales de MCPs
   */
  static getMCPStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await mcpService.getMCPStats();

    res.status(200).json(successResponse({ stats }));
  });

  /**
   * POST /api/mcps/:id/rate - Calificar MCP
   */
  static rateMCP = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const mcp = await mcpService.updateRating(id, rating);

    res.status(200).json(successResponse({ mcp }, 'MCP calificado'));
  });
}

export default MCPController;
