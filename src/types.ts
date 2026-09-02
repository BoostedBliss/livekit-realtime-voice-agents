export type IntegrationType = 'stt' | 'llm' | 'tts' | 'realtime';

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  type: IntegrationType;
  latencyAvg: string;
  features: string[];
  recommended?: boolean;
}

export interface PipelineConfig {
  mode: 'modular' | 'realtime_api';
  stt: string;
  llm: string;
  tts: string;
  realtimeModel: string;
  vadModel: 'silero_vad' | 'transformer_turn_detector';
  turnDetectionThreshold: number; // 0.0 - 1.0
  interruptionSensitivity: 'high' | 'balanced' | 'low';
  minSilenceDurationMs: number;
  systemPrompt: string;
  temperature: number;
  voiceName: string;
}

export interface LatencyBreakdown {
  sttMs: number;
  turnDetectMs: number;
  llmTtftMs: number;
  ttsTtfbMs: number;
  totalMs: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metrics?: LatencyBreakdown;
  toolCalls?: Array<{
    name: string;
    args: Record<string, any>;
    result: string;
  }>;
  interrupted?: boolean;
}

export interface McpServerConfig {
  id: string;
  name: string;
  endpoint: string;
  status: 'connected' | 'idle' | 'error';
  description: string;
  tools: Array<{
    name: string;
    description: string;
    parameters: string[];
  }>;
}

export interface RpcCallRecord {
  id: string;
  direction: 'client_to_agent' | 'agent_to_client';
  method: string;
  payload: any;
  response?: any;
  latencyMs: number;
  timestamp: string;
}

export interface SipCallSession {
  id: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  status: 'idle' | 'ringing' | 'connected' | 'ended';
  durationSeconds: number;
  sipTrunk: string;
  codec: string;
  dtmfHistory: string[];
}

export interface DispatchWorker {
  id: string;
  name: string;
  region: string;
  status: 'healthy' | 'busy' | 'offline';
  activeRooms: number;
  maxRooms: number;
  cpuPct: number;
  memoryMb: number;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  expectedBehavior: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  score?: number;
  verdict?: 'PASS' | 'FAIL' | 'NEEDS_IMPROVEMENT';
  feedback?: string;
  metrics?: {
    goalCompletion: number;
    factualAccuracy: number;
    latencyScore: number;
    interruptionResilience: number;
  };
}
