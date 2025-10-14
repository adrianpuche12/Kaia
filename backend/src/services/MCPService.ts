import { PrismaClient } from '@prisma/client';

// ============================================================================
// DTOs
// ============================================================================

export interface MCPDTO {
  id: string;
  name: string;
  type: 'PRECONFIGURED' | 'DYNAMIC' | 'USER_CREATED';
  category: string;
  description: string;
  capabilities: string[];
  inputSchema: any;
  outputSchema: any;
  apiEndpoint?: string;
  authRequired: boolean;
  usageCount: number;
  rating?: number;
  enabled: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

export interface CreateMCPDTO {
  name: string;
  type?: 'PRECONFIGURED' | 'DYNAMIC' | 'USER_CREATED';
  category: string;
  description: string;
  capabilities?: string[];
  inputSchema: any;
  outputSchema: any;
  executorCode?: string;
  apiEndpoint?: string;
  authRequired?: boolean;
  enabled?: boolean;
  createdBy?: string;
}

export interface UpdateMCPDTO {
  name?: string;
  description?: string;
  capabilities?: string[];
  inputSchema?: any;
  outputSchema?: any;
  executorCode?: string;
  apiEndpoint?: string;
  authRequired?: boolean;
  enabled?: boolean;
}

export interface ExecuteMCPDTO {
  mcpId: string;
  input: any;
  context?: {
    userId?: string;
    sessionId?: string;
    metadata?: any;
  };
}

export interface MCPExecutionResult {
  id: string;
  mcpId: string;
  mcpName: string;
  input: any;
  output: any;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  executionTime: number; // milisegundos
  error?: string;
  timestamp: Date;
}

export interface MCPStats {
  totalMCPs: number;
  byType: {
    preconfigured: number;
    dynamic: number;
    userCreated: number;
  };
  byCategory: { [key: string]: number };
  totalExecutions: number;
  successRate: number;
  mostUsed: MCPDTO[];
  topRated: MCPDTO[];
}

// ============================================================================
// MCPService
// ============================================================================

export class MCPService {
  constructor(private prisma: PrismaClient) {}

  // ==========================================================================
  // GESTIÓN DE MCPs (CRUD)
  // ==========================================================================

  /**
   * Listar MCPs con filtros
   */
  async listMCPs(filters: {
    type?: 'PRECONFIGURED' | 'DYNAMIC' | 'USER_CREATED';
    category?: string;
    enabled?: boolean;
    userId?: string;
  } = {}): Promise<MCPDTO[]> {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.enabled !== undefined) {
      where.enabled = filters.enabled;
    }

    if (filters.userId) {
      where.OR = [
        { type: 'PRECONFIGURED' },
        { type: 'DYNAMIC' },
        { type: 'USER_CREATED' },
      ];
    }

    const mcps = await this.prisma.mCP.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { rating: 'desc' },
      ],
    });

    return mcps.map(mcp => this.toDTO(mcp));
  }

  /**
   * Obtener MCP por ID
   */
  async getMCPById(mcpId: string): Promise<MCPDTO> {
    const mcp = await this.prisma.mCP.findUnique({
      where: { id: mcpId },
    });

    if (!mcp) {
      throw new Error('MCP not found');
    }

    return this.toDTO(mcp);
  }

  /**
   * Obtener MCP por nombre
   */
  async getMCPByName(name: string): Promise<MCPDTO | null> {
    const mcp = await this.prisma.mCP.findFirst({
      where: { name },
    });

    return mcp ? this.toDTO(mcp) : null;
  }

  /**
   * Registrar nuevo MCP
   */
  async registerMCP(data: CreateMCPDTO): Promise<MCPDTO> {
    // Verificar que no exista
    const existing = await this.getMCPByName(data.name);
    if (existing) {
      throw new Error('MCP with this name already exists');
    }

    // Validar código ejecutor si existe
    if (data.executorCode) {
      this.validateExecutorCode(data.executorCode);
    }

    const mcp = await this.prisma.mCP.create({
      data: {
        name: data.name,
        type: data.type || 'USER_CREATED',
        category: data.category,
        description: data.description,
        capabilities: JSON.stringify(data.capabilities || []),
        inputSchema: JSON.stringify(data.inputSchema || {}),
        outputSchema: JSON.stringify(data.outputSchema || {}),
        executorCode: data.executorCode || '',
        enabled: data.enabled !== false,
      },
    });

    console.log(`[MCP] Registered: ${mcp.name} (${mcp.type})`);

    return this.toDTO(mcp);
  }

  /**
   * Actualizar MCP
   */
  async updateMCP(mcpId: string, data: UpdateMCPDTO): Promise<MCPDTO> {
    const existing = await this.prisma.mCP.findUnique({
      where: { id: mcpId },
    });

    if (!existing) {
      throw new Error('MCP not found');
    }

    // Solo se pueden editar MCPs USER_CREATED o DYNAMIC
    if (existing.type === 'PRECONFIGURED') {
      throw new Error('Cannot edit preconfigured MCPs');
    }

    // Validar código si se actualiza
    if (data.executorCode) {
      this.validateExecutorCode(data.executorCode);
    }

    const mcp = await this.prisma.mCP.update({
      where: { id: mcpId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.capabilities && { capabilities: JSON.stringify(data.capabilities) }),
        ...(data.inputSchema && { inputSchema: JSON.stringify(data.inputSchema) }),
        ...(data.outputSchema && { outputSchema: JSON.stringify(data.outputSchema) }),
        ...(data.executorCode && { executorCode: data.executorCode }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
      },
    });

    console.log(`[MCP] Updated: ${mcp.name}`);

    return this.toDTO(mcp);
  }

  /**
   * Eliminar MCP
   */
  async deleteMCP(mcpId: string): Promise<void> {
    const mcp = await this.prisma.mCP.findUnique({
      where: { id: mcpId },
    });

    if (!mcp) {
      throw new Error('MCP not found');
    }

    // Solo se pueden eliminar MCPs USER_CREATED
    if (mcp.type !== 'USER_CREATED') {
      throw new Error('Can only delete user-created MCPs');
    }

    await this.prisma.mCP.delete({
      where: { id: mcpId },
    });

    console.log(`[MCP] Deleted: ${mcp.name}`);
  }

  /**
   * Habilitar/deshabilitar MCP
   */
  async toggleMCP(mcpId: string, enabled: boolean): Promise<MCPDTO> {
    return await this.updateMCP(mcpId, { enabled });
  }

  // ==========================================================================
  // EJECUCIÓN DE MCPs
  // ==========================================================================

  /**
   * Ejecutar MCP
   */
  async executeMCP(data: ExecuteMCPDTO): Promise<MCPExecutionResult> {
    const startTime = Date.now();

    try {
      // Obtener MCP
      const mcp = await this.getMCPById(data.mcpId);

      if (!mcp.enabled) {
        throw new Error('MCP is disabled');
      }

      // Validar input según schema
      this.validateInput(data.input, mcp.inputSchema);

      // Ejecutar según tipo
      let output: any;

      if (mcp.apiEndpoint) {
        // Ejecutar vía API externa
        output = await this.executeViaAPI(mcp, data.input, data.context);
      } else if (mcp.type === 'PRECONFIGURED') {
        // Ejecutar MCP preconfigurado
        output = await this.executePreconfigured(mcp, data.input, data.context);
      } else {
        // Ejecutar código personalizado
        output = await this.executeCustomCode(mcp, data.input, data.context);
      }

      const executionTime = Date.now() - startTime;

      // Guardar ejecución
      const execution = await this.saveExecution({
        mcpId: mcp.id,
        userId: data.context?.userId,
        input: data.input,
        output,
        status: 'SUCCESS',
        executionTime,
      });

      // Incrementar contador de uso
      await this.incrementUsageCount(mcp.id);

      return {
        id: execution.id,
        mcpId: mcp.id,
        mcpName: mcp.name,
        input: data.input,
        output,
        status: 'SUCCESS',
        executionTime,
        timestamp: new Date(),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Guardar ejecución fallida
      const execution = await this.saveExecution({
        mcpId: data.mcpId,
        userId: data.context?.userId,
        input: data.input,
        output: null,
        status: 'ERROR',
        executionTime,
        error: errorMessage,
      });

      return {
        id: execution.id,
        mcpId: data.mcpId,
        mcpName: 'Unknown',
        input: data.input,
        output: null,
        status: 'ERROR',
        executionTime,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Ejecutar vía API externa
   */
  private async executeViaAPI(
    mcp: MCPDTO,
    input: any,
    context?: any
  ): Promise<any> {
    if (!mcp.apiEndpoint) {
      throw new Error('No API endpoint configured');
    }

    // TODO: Implementar llamada HTTP real
    console.log(`[MCP] Calling API: ${mcp.apiEndpoint}`, input);

    // Mock
    return {
      success: true,
      data: { message: 'API call successful', input }
    };
  }

  /**
   * Ejecutar MCP preconfigurado
   */
  private async executePreconfigured(
    mcp: MCPDTO,
    input: any,
    context?: any
  ): Promise<any> {
    console.log(`[MCP] Executing preconfigured: ${mcp.name}`, input);

    // MCPs preconfigurados comunes
    switch (mcp.name) {
      case 'create_event':
        return { eventId: 'event_123', ...input };

      case 'create_reminder':
        return { reminderId: 'reminder_456', ...input };

      case 'send_message':
        return { messageId: 'msg_789', status: 'sent', ...input };

      case 'search_contacts':
        return { results: [], query: input.query };

      default:
        throw new Error(`Unknown preconfigured MCP: ${mcp.name}`);
    }
  }

  /**
   * Ejecutar código personalizado
   */
  private async executeCustomCode(
    mcp: MCPDTO,
    input: any,
    context?: any
  ): Promise<any> {
    const mcpData = await this.prisma.mCP.findUnique({
      where: { id: mcp.id },
    });

    if (!mcpData?.executorCode) {
      throw new Error('No executor code defined');
    }

    console.log(`[MCP] Executing custom code: ${mcp.name}`);

    try {
      // Ejecutar código en sandbox
      const executor = new Function('input', 'context', mcpData.executorCode);
      const result = await executor(input, context);

      return result;
    } catch (error) {
      throw new Error(`Execution failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  // ==========================================================================
  // BÚSQUEDA Y RECOMENDACIONES
  // ==========================================================================

  /**
   * Buscar MCPs por capacidad
   */
  async findMCPsByCapability(capability: string): Promise<MCPDTO[]> {
    const mcps = await this.prisma.mCP.findMany({
      where: {
        enabled: true,
        capabilities: {
          contains: capability,
        },
      },
      orderBy: [
        { usageCount: 'desc' },
        { rating: 'desc' },
      ],
    });

    return mcps.map(mcp => this.toDTO(mcp));
  }

  /**
   * Obtener MCPs recomendados
   */
  async getRecommendedMCPs(
    userId: string,
    context?: {
      category?: string;
      recentIntent?: string;
    }
  ): Promise<MCPDTO[]> {
    // Obtener MCPs más usados por el usuario
    const userExecutions = await this.prisma.mCPExecution.groupBy({
      by: ['mcpId'],
      where: { userId },
      _count: { mcpId: true },
      orderBy: { _count: { mcpId: 'desc' } },
      take: 5,
    });

    const userMCPIds = userExecutions.map(e => e.mcpId);

    // Obtener MCPs
    const where: any = {
      enabled: true,
    };

    if (context?.category) {
      where.category = context.category;
    }

    const mcps = await this.prisma.mCP.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { rating: 'desc' },
      ],
      take: 10,
    });

    // Priorizar MCPs que el usuario ya ha usado
    const sorted = mcps.sort((a, b) => {
      const aUsed = userMCPIds.includes(a.id) ? 1 : 0;
      const bUsed = userMCPIds.includes(b.id) ? 1 : 0;
      return bUsed - aUsed;
    });

    return sorted.map(mcp => this.toDTO(mcp));
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  /**
   * Obtener estadísticas de MCPs
   */
  async getMCPStats(): Promise<MCPStats> {
    const allMCPs = await this.prisma.mCP.findMany();

    const byType = {
      preconfigured: allMCPs.filter(m => m.type === 'PRECONFIGURED').length,
      dynamic: allMCPs.filter(m => m.type === 'DYNAMIC').length,
      userCreated: allMCPs.filter(m => m.type === 'USER_CREATED').length,
    };

    const byCategory: { [key: string]: number } = {};
    allMCPs.forEach(mcp => {
      byCategory[mcp.category] = (byCategory[mcp.category] || 0) + 1;
    });

    const executions = await this.prisma.mCPExecution.findMany();
    // Campo 'success' en lugar de 'status'
    const successCount = executions.filter(e => e.success === true).length;
    const successRate = executions.length > 0
      ? (successCount / executions.length) * 100
      : 0;

    const mostUsed = allMCPs
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(mcp => this.toDTO(mcp));

    const topRated = allMCPs
      .filter(mcp => mcp.rating !== null)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)
      .map(mcp => this.toDTO(mcp));

    return {
      totalMCPs: allMCPs.length,
      byType,
      byCategory,
      totalExecutions: executions.length,
      successRate: Math.round(successRate * 10) / 10,
      mostUsed,
      topRated,
    };
  }

  /**
   * Obtener historial de ejecuciones
   */
  async getExecutionHistory(
    userId: string,
    limit: number = 50
  ): Promise<MCPExecutionResult[]> {
    const executions = await this.prisma.mCPExecution.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { mcp: true },
    });

    return executions.map(exec => ({
      id: exec.id,
      mcpId: exec.mcpId,
      mcpName: exec.mcp.name,
      // Campos: inputData y outputData en lugar de input/output
      input: typeof exec.inputData === 'string' ? JSON.parse(exec.inputData) : exec.inputData,
      output: exec.outputData ? (typeof exec.outputData === 'string' ? JSON.parse(exec.outputData) : exec.outputData) : null,
      // Campo 'success' booleano en lugar de 'status' string
      status: exec.success ? 'SUCCESS' : 'ERROR',
      // Campo executionTimeMs en lugar de executionTime
      executionTime: exec.executionTimeMs || 0,
      // Campo errorMessage en lugar de error
      error: exec.errorMessage || undefined,
      timestamp: exec.createdAt,
    }));
  }

  // ==========================================================================
  // RATING
  // ==========================================================================

  /**
   * Actualizar rating de MCP
   */
  async updateRating(mcpId: string, rating: number): Promise<MCPDTO> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const mcp = await this.prisma.mCP.update({
      where: { id: mcpId },
      data: { rating },
    });

    return this.toDTO(mcp);
  }

  // ==========================================================================
  // UTILIDADES PRIVADAS
  // ==========================================================================

  /**
   * Incrementar contador de uso
   */
  private async incrementUsageCount(mcpId: string): Promise<void> {
    await this.prisma.mCP.update({
      where: { id: mcpId },
      data: {
        usageCount: { increment: 1 },
      },
    });
  }

  /**
   * Guardar ejecución en BD
   */
  private async saveExecution(data: {
    mcpId: string;
    userId?: string;
    input: any;
    output: any;
    status: string;
    executionTime: number;
    error?: string;
  }) {
    return await this.prisma.mCPExecution.create({
      data: {
        mcpId: data.mcpId,
        userId: data.userId,
        // Campos: inputData y outputData
        inputData: JSON.stringify(data.input),
        outputData: data.output ? JSON.stringify(data.output) : null,
        // Campo success (boolean) en lugar de status (string)
        success: data.status === 'SUCCESS',
        // Campo executionTimeMs
        executionTimeMs: data.executionTime,
        // Campo errorMessage
        errorMessage: data.error,
      },
    });
  }

  /**
   * Validar input según schema
   */
  private validateInput(input: any, schema: any): void {
    // TODO: Implementar validación JSON Schema completa
    if (!input) {
      throw new Error('Input is required');
    }
  }

  /**
   * Validar código ejecutor
   */
  private validateExecutorCode(code: string): void {
    const forbidden = [
      'eval(',
      'Function(',
      'require(',
      'import(',
      'process.exit',
      'child_process',
      'fs.unlink',
      'fs.rmdir',
      'rm -rf',
    ];

    for (const pattern of forbidden) {
      if (code.includes(pattern)) {
        throw new Error(`Code contains forbidden pattern: ${pattern}`);
      }
    }

    // Validar sintaxis
    try {
      new Function('input', 'context', code);
    } catch (error: any) {
      throw new Error(`Syntax error in executor code: ${error.message}`);
    }
  }

  /**
   * Convertir modelo Prisma a DTO
   */
  private toDTO(mcp: any): MCPDTO {
    return {
      id: mcp.id,
      name: mcp.name,
      type: mcp.type,
      category: mcp.category,
      description: mcp.description,
      capabilities: JSON.parse(mcp.capabilities),
      inputSchema: JSON.parse(mcp.inputSchema),
      outputSchema: JSON.parse(mcp.outputSchema),
      apiEndpoint: undefined,
      authRequired: false,
      usageCount: mcp.usageCount,
      rating: mcp.rating || undefined,
      enabled: mcp.enabled,
      createdBy: undefined,
      createdAt: mcp.createdAt,
      updatedAt: mcp.updatedAt,
      lastUsedAt: undefined,
    };
  }
}
