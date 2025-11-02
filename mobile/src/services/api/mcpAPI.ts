// API de MCPs
import { apiClient } from './apiClient';
import {
  MCP,
  CreateMCPRequest,
  ExecuteMCPRequest,
  MCPExecutionResult,
  GenerateMCPRequest,
} from '../../types';

class MCPAPI {
  async listMCPs(filters?: {
    type?: string;
    category?: string;
    enabled?: boolean;
  }): Promise<MCP[]> {
    const response = await apiClient.get<{ mcps: MCP[] }>('/mcps', filters);
    return response.data!.mcps;
  }

  async getRecommendedMCPs(context?: {
    category?: string;
    recentIntent?: string;
  }): Promise<MCP[]> {
    const response = await apiClient.get<{ mcps: MCP[] }>('/mcps/recommended', context);
    return response.data!.mcps;
  }

  async getMCPById(id: string): Promise<MCP> {
    const response = await apiClient.get<{ mcp: MCP }>(`/mcps/${id}`);
    return response.data!.mcp;
  }

  async registerMCP(data: CreateMCPRequest): Promise<MCP> {
    const response = await apiClient.post<{ mcp: MCP }>('/mcps', data);
    return response.data!.mcp;
  }

  async updateMCP(id: string, data: Partial<CreateMCPRequest>): Promise<MCP> {
    const response = await apiClient.put<{ mcp: MCP }>(`/mcps/${id}`, data);
    return response.data!.mcp;
  }

  async deleteMCP(id: string): Promise<void> {
    await apiClient.delete(`/mcps/${id}`);
  }

  async toggleMCP(id: string, enabled: boolean): Promise<MCP> {
    const response = await apiClient.post<{ mcp: MCP }>(`/mcps/${id}/toggle`, { enabled });
    return response.data!.mcp;
  }

  async executeMCP(request: ExecuteMCPRequest): Promise<MCPExecutionResult> {
    const response = await apiClient.post<MCPExecutionResult>('/mcps/execute', request);
    return response.data!;
  }

  async generateMCP(request: GenerateMCPRequest): Promise<MCP> {
    const response = await apiClient.post<{ mcp: MCP }>('/mcps/generate', request);
    return response.data!.mcp;
  }

  async getExecutionHistory(filters?: {
    mcpId?: string;
    success?: boolean;
    limit?: number;
  }): Promise<any[]> {
    const response = await apiClient.get<{ history: any[] }>('/mcps/executions/history', filters);
    return response.data!.history;
  }

  async getExecutionStats(mcpId?: string): Promise<any> {
    const response = await apiClient.get<{ stats: any }>('/mcps/executions/stats', { mcpId });
    return response.data!.stats;
  }

  // Nuevos endpoints agregados - Fase 1
  async findByCapability(capability: string): Promise<MCP[]> {
    const response = await apiClient.get<{ mcps: MCP[] }>(`/mcps/capability/${capability}`);
    return response.data!.mcps;
  }

  async getMCPStats(): Promise<{
    total: number;
    enabled: number;
    disabled: number;
    totalExecutions: number;
  }> {
    const response = await apiClient.get<{
      stats: {
        total: number;
        enabled: number;
        disabled: number;
        totalExecutions: number;
      };
    }>('/mcps/stats');
    return response.data!.stats;
  }

  async rateMCP(id: string, rating: number): Promise<MCP> {
    const response = await apiClient.post<{ mcp: MCP }>(`/mcps/${id}/rate`, { rating });
    return response.data!.mcp;
  }
}

export const mcpAPI = new MCPAPI();
export default mcpAPI;
