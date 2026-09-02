import React, { useState } from 'react';
import { 
  Cpu, 
  Server, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Network, 
  HardDrive
} from 'lucide-react';

export const SelfHostHub: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const dockerComposeYaml = `version: "3.9"

services:
  # 1. LiveKit WebRTC SFU Server (Go-based media server)
  livekit:
    image: livekit/livekit-server:latest
    container_name: livekit-server
    restart: unless-stopped
    ports:
      - "7880:7880"         # HTTP / WebSocket signaling
      - "7881:7881"         # TCP fallback
      - "50000-50100:50000-50100/udp" # WebRTC media (RTP/SRTP)
    environment:
      - LIVEKIT_CONFIG=/etc/livekit.yaml
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
    depends_on:
      - redis

  # 2. Redis for Job Scheduling & Worker Dispatch
  redis:
    image: redis:7-alpine
    container_name: livekit-redis
    restart: unless-stopped
    ports:
      - "6379:6379"

  # 3. LiveKit Telephony SIP Gateway
  livekit-sip:
    image: livekit/sip:latest
    container_name: livekit-sip-gateway
    restart: unless-stopped
    ports:
      - "5060:5060/udp"     # SIP signaling
      - "10000-10100:10000-10100/udp" # RTP telephony audio
    environment:
      - SIP_CONFIG=/etc/sip.yaml
    depends_on:
      - livekit

  # 4. Agent Worker Process (Your Python/TS Voice Agent)
  agent-worker:
    build: .
    command: python agent.py dev
    environment:
      - LIVEKIT_URL=ws://livekit:7880
      - LIVEKIT_API_KEY=devkey
      - LIVEKIT_API_SECRET=secret
      - DEEPGRAM_API_KEY=\${DEEPGRAM_API_KEY}
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - CARTESIA_API_KEY=\${CARTESIA_API_KEY}
    depends_on:
      - livekit`;

  const helmChartCommands = `# 1. Add LiveKit Helm repository
helm repo add livekit https://helm.livekit.io
helm repo update

# 2. Deploy LiveKit Server Cluster with Redis HA
helm install livekit livekit/livekit-server \\
  --set redis.host=redis-cluster.default.svc.cluster.local \\
  --set livekit.apiKey=my-api-key \\
  --set livekit.apiSecret=my-api-secret

# 3. Deploy Agent Worker DaemonSet
kubectl apply -f livekit-agent-deployment.yaml`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                100% Open-Source & Self-Hostable Stack
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Apache 2.0 License
              </span>
            </div>
            <p className="text-xs text-zinc-500 max-w-3xl">
              No vendor lock-in. Run the entire real-time stack on your own bare-metal servers, AWS, GCP, Azure, or Kubernetes clusters. LiveKit Server is one of the world's most widely deployed WebRTC media servers.
            </p>
          </div>

          <a
            href="https://github.com/livekit/agents"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            GitHub Repository
          </a>
        </div>
      </div>

      {/* Architecture Topology */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Network className="w-4 h-4 text-indigo-600" />
          End-to-End System Architecture
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              <Server className="w-4 h-4 text-emerald-600" />
              1. LiveKit Media Server
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              Written in Go. High-throughput Selective Forwarding Unit (SFU) handling WebRTC peer connections, SRTP encryption, ICE, and DataChannels.
            </p>
            <span className="text-[10px] font-mono text-zinc-400 block pt-1 border-t border-zinc-200">
              Port: 7880 / 50000+ UDP
            </span>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              <Cpu className="w-4 h-4 text-indigo-600" />
              2. Agent Worker Pool
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              Python / TypeScript processes. Joins rooms automatically, streams audio frames to STT/LLM/TTS pipelines, and manages semantic turn detection.
            </p>
            <span className="text-[10px] font-mono text-zinc-400 block pt-1 border-t border-zinc-200">
              CLI: lk agent run
            </span>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              <HardDrive className="w-4 h-4 text-amber-600" />
              3. Redis Dispatcher
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              Provides pub/sub messaging, worker registration, heartbeat tracking, and room task scheduling with sub-millisecond dispatch times.
            </p>
            <span className="text-[10px] font-mono text-zinc-400 block pt-1 border-t border-zinc-200">
              Port: 6379 Redis 7
            </span>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              4. SIP Telephony Gateway
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              PSTN SIP bridge connecting telephone trunks (Twilio, Telnyx, Asterisk) to LiveKit WebRTC rooms with DTMF tone signaling.
            </p>
            <span className="text-[10px] font-mono text-zinc-400 block pt-1 border-t border-zinc-200">
              Port: 5060 SIP / RTP
            </span>
          </div>
        </div>
      </div>

      {/* Docker Compose File */}
      <div className="bg-zinc-950 text-white rounded-xl p-6 shadow-xs border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">docker-compose.yml</h3>
              <p className="text-xs text-zinc-400">Launch the full stack locally with a single command.</p>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(dockerComposeYaml, 'compose')}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-700"
          >
            {copiedSection === 'compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSection === 'compose' ? 'Copied' : 'Copy Compose'}
          </button>
        </div>

        <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-xs font-mono text-zinc-300 border border-zinc-800/80 leading-relaxed max-h-72">
          <code>{dockerComposeYaml}</code>
        </pre>
      </div>

      {/* Kubernetes Helm Chart Deployment */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
            Kubernetes Helm Production Deployment
          </h3>
          <button
            onClick={() => copyToClipboard(helmChartCommands, 'helm')}
            className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-200"
          >
            {copiedSection === 'helm' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            {copiedSection === 'helm' ? 'Copied' : 'Copy Helm'}
          </button>
        </div>

        <pre className="bg-zinc-900 text-zinc-200 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed border border-zinc-800">
          <code>{helmChartCommands}</code>
        </pre>
      </div>
    </div>
  );
};
