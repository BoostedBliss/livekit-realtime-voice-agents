import { ModelOption, McpServerConfig, DispatchWorker, TestCase, PipelineConfig } from '../types';

export const STT_MODELS: ModelOption[] = [
  {
    id: 'deepgram-nova-2',
    name: 'Deepgram Nova-2',
    provider: 'Deepgram',
    type: 'stt',
    latencyAvg: '110ms',
    features: ['Real-time streaming WebSockets', 'Smart formatting', 'Keyterm boosting', 'Multilingual'],
    recommended: true,
  },
  {
    id: 'whisper-turbo',
    name: 'OpenAI Whisper v3 Turbo',
    provider: 'OpenAI',
    type: 'stt',
    latencyAvg: '180ms',
    features: ['High accuracy on accents', 'Open weights', '99+ languages supported'],
  },
  {
    id: 'assemblyai-universal-2',
    name: 'AssemblyAI Universal-2',
    provider: 'AssemblyAI',
    type: 'stt',
    latencyAvg: '150ms',
    features: ['Entity detection', 'Custom vocabulary', 'Punctuation restoration'],
  },
  {
    id: 'google-cloud-speech',
    name: 'Google Cloud Speech-to-Text v2',
    provider: 'Google Cloud',
    type: 'stt',
    latencyAvg: '130ms',
    features: ['Chirp-2 model', 'Automated speaker diarization', 'Low word error rate'],
  },
];

export const LLM_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'Google DeepMind',
    type: 'llm',
    latencyAvg: '210ms',
    features: ['Sub-300ms TTFT', 'Native multimodal reasoning', '1M token window', 'Low cost'],
    recommended: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'OpenAI',
    type: 'llm',
    latencyAvg: '240ms',
    features: ['High speed', 'Function calling', '128k context'],
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    type: 'llm',
    latencyAvg: '390ms',
    features: ['Exceptional reasoning', 'Artifacts & code execution', 'Nuanced tone'],
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta (vLLM / Groq)',
    type: 'llm',
    latencyAvg: '160ms',
    features: ['Open-weights self-hostable', 'Ultra-fast token throughput', 'Tool calling'],
  },
];

export const TTS_MODELS: ModelOption[] = [
  {
    id: 'cartesia-sonic',
    name: 'Cartesia Sonic',
    provider: 'Cartesia',
    type: 'tts',
    latencyAvg: '90ms',
    features: ['State-space model architecture', 'Ultra-low TTFB (<100ms)', 'Emotion control', 'Voice cloning'],
    recommended: true,
  },
  {
    id: 'elevenlabs-flash-v2-5',
    name: 'ElevenLabs Flash v2.5',
    provider: 'ElevenLabs',
    type: 'tts',
    latencyAvg: '125ms',
    features: ['Natural voice cadence', '32 languages', 'Zero-shot voice cloning'],
  },
  {
    id: 'openai-tts-1',
    name: 'OpenAI TTS-1 Alloy',
    provider: 'OpenAI',
    type: 'tts',
    latencyAvg: '160ms',
    features: ['Consistent timbre', 'Multi-accent support', 'Clean audio normalization'],
  },
  {
    id: 'google-journey',
    name: 'Google Cloud Journey Voices',
    provider: 'Google Cloud',
    type: 'tts',
    latencyAvg: '140ms',
    features: ['Studio audio fidelity', 'Interactive dialogue pacing', 'SSML support'],
  },
];

export const REALTIME_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.1-flash-live-preview',
    name: 'Gemini Live API (Bidirectional Audio)',
    provider: 'Google DeepMind',
    type: 'realtime',
    latencyAvg: '280ms',
    features: ['Native speech-in to speech-out', 'Zero STT/TTS roundtrips', 'Direct interruption handling'],
    recommended: true,
  },
  {
    id: 'openai-realtime-preview',
    name: 'OpenAI Realtime API (WebRTC)',
    provider: 'OpenAI',
    type: 'realtime',
    latencyAvg: '320ms',
    features: ['Integrated WebRTC session', 'Native voice activity detection', 'Function calling'],
  },
];

export const DEFAULT_PIPELINE: PipelineConfig = {
  mode: 'modular',
  stt: 'deepgram-nova-2',
  llm: 'gemini-3.8-flash',
  tts: 'cartesia-sonic',
  realtimeModel: 'gemini-3.1-flash-live-preview',
  vadModel: 'transformer_turn_detector',
  turnDetectionThreshold: 0.85,
  interruptionSensitivity: 'balanced',
  minSilenceDurationMs: 250,
  systemPrompt: 'You are an ultra-fast, natural voice AI assistant powered by LiveKit Agents. Speak concisely and conversationally in 1-2 sentences.',
  temperature: 0.7,
  voiceName: 'Cartesia Sonic (British / Clear)',
};

export const INITIAL_MCP_SERVERS: McpServerConfig[] = [
  {
    id: 'mcp-postgres',
    name: 'Postgres CRM Database',
    endpoint: 'http://postgres-mcp.internal:8000/sse',
    status: 'connected',
    description: 'Direct SQL query execution and transactional customer record lookup via Model Context Protocol.',
    tools: [
      {
        name: 'postgres_query',
        description: 'Execute parameterized read-only SQL queries on customer accounts and orders.',
        parameters: ['sql: string', 'limit: number'],
      },
      {
        name: 'get_table_schema',
        description: 'Inspect table schema, foreign keys, and indexes.',
        parameters: ['tableName: string'],
      },
    ],
  },
  {
    id: 'mcp-github',
    name: 'GitHub Repository MCP',
    endpoint: 'http://github-mcp.internal:8000/sse',
    status: 'connected',
    description: 'Inspect live issues, pull requests, releases, and repository metrics.',
    tools: [
      {
        name: 'github_search',
        description: 'Search repository issues and release notes.',
        parameters: ['query: string', 'repo: string'],
      },
    ],
  },
  {
    id: 'mcp-calendar',
    name: 'Google Calendar Scheduler',
    endpoint: 'http://calendar-mcp.internal:8000/sse',
    status: 'connected',
    description: 'Check free/busy calendar slots and reserve appointment times with attendees.',
    tools: [
      {
        name: 'calendar_check',
        description: 'List open time slots for a given date range.',
        parameters: ['startDate: string', 'endDate: string'],
      },
    ],
  },
];

export const INITIAL_WORKERS: DispatchWorker[] = [
  {
    id: 'worker-us-west-1',
    name: 'agent-node-01',
    region: 'us-west (Oregon)',
    status: 'healthy',
    activeRooms: 7,
    maxRooms: 25,
    cpuPct: 24,
    memoryMb: 412,
  },
  {
    id: 'worker-us-east-1',
    name: 'agent-node-02',
    region: 'us-east (Virginia)',
    status: 'healthy',
    activeRooms: 12,
    maxRooms: 25,
    cpuPct: 38,
    memoryMb: 520,
  },
  {
    id: 'worker-eu-central-1',
    name: 'agent-node-03',
    region: 'eu-central (Frankfurt)',
    status: 'healthy',
    activeRooms: 4,
    maxRooms: 20,
    cpuPct: 18,
    memoryMb: 360,
  },
  {
    id: 'worker-ap-southeast-1',
    name: 'agent-node-04',
    region: 'ap-southeast (Tokyo)',
    status: 'healthy',
    activeRooms: 2,
    maxRooms: 20,
    cpuPct: 12,
    memoryMb: 290,
  },
];

export const INITIAL_TEST_CASES: TestCase[] = [
  {
    id: 'tc-returns',
    title: 'Customer Returns Policy & Factual Precision',
    description: 'Verify the voice agent accurately explains the 30-day return policy without hallucinating fees.',
    expectedBehavior: 'State 30-day window, mention original packaging, offer prepaid return label.',
    status: 'passed',
    score: 96,
    verdict: 'PASS',
    feedback: 'Accurately stated 30-day refund window with concise voice cadence (under 32 words).',
    metrics: {
      goalCompletion: 98,
      factualAccuracy: 95,
      latencyScore: 97,
      interruptionResilience: 94,
    },
  },
  {
    id: 'tc-interruption',
    title: 'Mid-Sentence Barge-in Interruption',
    description: 'User speaks while agent is mid-sentence: tests instant audio cutoff (<50ms) and context retention.',
    expectedBehavior: 'Agent immediately stops TTS output, listens to user new request, and acknowledges new instruction.',
    status: 'passed',
    score: 94,
    verdict: 'PASS',
    feedback: 'Silero VAD + transformer turn detector triggered audio stop within 42ms with zero audio overlap.',
    metrics: {
      goalCompletion: 94,
      factualAccuracy: 92,
      latencyScore: 98,
      interruptionResilience: 96,
    },
  },
  {
    id: 'tc-tool-call',
    title: 'MCP Tool Calling: Order Status Retrieval',
    description: 'User asks for order #LK-9821 status: agent calls Postgres MCP tool and reports tracking info.',
    expectedBehavior: 'Executes postgres_query tool, receives delivery ETA, speaks single-sentence answer.',
    status: 'idle',
  },
  {
    id: 'tc-latency-sla',
    title: 'Sub-500ms End-to-End Latency SLA',
    description: 'Benchmark that full STT -> Turn Detector -> LLM TTFT -> TTS TTFB cycle completes under 500ms.',
    expectedBehavior: 'Total pipeline response start under 500ms threshold across 10 sequential turns.',
    status: 'idle',
  },
];
