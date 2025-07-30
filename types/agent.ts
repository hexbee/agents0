export interface Agent {
  id: string;
  name: string;
  description: string;
  tools: string[];
  color: string;
  systemPrompt: string;
  filename: string;
}

export interface AgentFilters {
  search?: string;
  color?: string;
  tools?: string[];
}

export interface AgentsResponse {
  agents: Agent[];
  total: number;
  filters: AgentFilters;
}