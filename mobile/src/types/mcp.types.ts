// Tipos relacionados con MCPs
export interface MCP {
  id: string;
  name: string;
  type: MCPType;
  category: MCPCategory;
  description: string;
  capabilities: string[];
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
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

export type MCPType = 'PRECONFIGURED' | 'DYNAMIC' | 'USER_CREATED';

export type MCPCategory =
  | 'COMMUNICATION'
  | 'LOCATION'
  | 'CALENDAR'
  | 'PRODUCTIVITY'
  | 'DATA'
  | 'CUSTOM';

export interface CreateMCPRequest {
  name: string;
  type?: MCPType;
  category: MCPCategory;
  description: string;
  capabilities: string[];
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  executorCode?: string;
  apiEndpoint?: string;
  authRequired?: boolean;
  enabled?: boolean;
}

export interface ExecuteMCPRequest {
  mcpId: string;
  input: any;
  context?: any;
}

export interface MCPExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
  metadata?: {
    mcpId: string;
    mcpName: string;
    executionMethod: string;
  };
}

export interface GenerateMCPRequest {
  description: string;
  desiredCapabilities: string[];
  targetService?: string;
  inputExample?: any;
  outputExample?: any;
}
