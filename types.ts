
export type AgentID = 
  | 'supervisor'
  | 'intake'
  | 'agronomy'
  | 'pest-disease'
  | 'weather'
  | 'synthesizer'
  | 'quality-review';

export interface AgentInfo {
  id: AgentID;
  name: string;
  role: string;
  color: string;
  icon: string;
}

export interface HistoricalRecord {
  id: string;
  season: string;
  cropType: string;
  issue: string;
  intervention: string;
  outcome: 'successful' | 'unsuccessful' | 'partial';
  notes?: string;
  timestamp: number;
}

export interface SharedMemory {
  farmerProfile: {
    location?: string;
    cropType?: string;
    farmSize?: string;
    season?: string;
  };
  observedSymptoms: string[];
  environmentalFactors: string;
  history: HistoricalRecord[];
  intermediateFindings: Array<{
    agentId: AgentID;
    finding: string;
    timestamp: number;
  }>;
  humanApprovals: Array<{
    action: string;
    approved: boolean;
    reason?: string;
  }>;
  finalRecommendations?: string;
  status: 'idle' | 'collecting' | 'analyzing' | 'reviewing' | 'awaiting_approval' | 'completed' | 'error';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  agentId?: AgentID;
  content: string;
  timestamp: number;
  isApprovalRequired?: boolean;
}

export interface WorkflowState {
  activeAgent: AgentID | null;
  logs: Array<{
    id: string;
    agentId: AgentID;
    text: string;
    type: 'info' | 'decision' | 'warning';
  }>;
}
