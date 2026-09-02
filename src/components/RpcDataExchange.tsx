import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Send, 
  Code2, 
  Check, 
  Copy, 
  Smartphone, 
  Monitor, 
  Gamepad2, 
  Terminal,
  Zap
} from 'lucide-react';
import { RpcCallRecord } from '../types';

export const RpcDataExchange: React.FC = () => {
  const [activePlatform, setActivePlatform] = useState<'react' | 'swift' | 'kotlin' | 'flutter' | 'unity'>('react');
  const [selectedRpc, setSelectedRpc] = useState('pushClientContext');
  const [rpcPayload, setRpcPayload] = useState('{\n  "latitude": 37.7749,\n  "longitude": -122.4194,\n  "batteryLevel": 0.88,\n  "userTier": "enterprise"\n}');
  const [rpcHistory, setRpcHistory] = useState<RpcCallRecord[]>([
    {
      id: 'rpc-1',
      direction: 'client_to_agent',
      method: 'pushClientContext',
      payload: { clientAppVersion: '2.4.1', activeScreen: 'checkout_cart' },
      response: { acknowledged: true, agentSessionId: 'sess-8491' },
      latencyMs: 14,
      timestamp: '13:20:12',
    },
    {
      id: 'rpc-2',
      direction: 'agent_to_client',
      method: 'highlightUIElement',
      payload: { selector: '#checkout-button', color: '#10b981', pulse: true },
      response: { rendered: true },
      latencyMs: 11,
      timestamp: '13:20:15',
    },
  ]);

  const [executing, setExecuting] = useState(false);

  const handleSendRpc = () => {
    setExecuting(true);
    let parsed = {};
    try {
      parsed = JSON.parse(rpcPayload);
    } catch {
      parsed = { raw: rpcPayload };
    }

    setTimeout(() => {
      const newRecord: RpcCallRecord = {
        id: 'rpc-' + Date.now(),
        direction: 'client_to_agent',
        method: selectedRpc,
        payload: parsed,
        response: {
          status: 'success',
          syncedAt: new Date().toISOString(),
          agentAction: `Handled RPC ${selectedRpc} with zero overhead`,
        },
        latencyMs: Math.floor(Math.random() * 12) + 8,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setRpcHistory((prev) => [newRecord, ...prev]);
      setExecuting(false);
    }, 250);
  };

  const platformCode: Record<string, string> = {
    react: `// React WebRTC Client (@livekit/components-react)
import { useRoomContext } from '@livekit/components-react';

export function VoiceWidget() {
  const room = useRoomContext();

  const sendLocationContext = async () => {
    // Perform typed RPC to LiveKit Agent
    const response = await room.localParticipant.performRpc({
      destinationIdentity: 'agent-participant',
      method: 'pushClientContext',
      payload: JSON.stringify({ lat: 37.77, lon: -122.41 }),
    });
    console.log('Agent RPC ACK:', response);
  };

  // Register client-side RPC handler callable by the agent
  room.localParticipant.registerRpcMethod('highlightUIElement', async (data) => {
    document.querySelector(data.payload.selector)?.classList.add('highlight');
    return JSON.stringify({ success: true });
  });
}`,
    swift: `// iOS Swift SDK (LiveKit iOS)
import LiveKit

// Call agent RPC from iPhone app
let response = try await room.localParticipant.performRpc(
    destinationIdentity: "agent-participant",
    method: "pushClientContext",
    payload: "{\\"lat\\": 37.77, \\"device\\": \\"iPhone 16 Pro\\"}"
)`,
    kotlin: `// Android Kotlin SDK (livekit-android)
import io.livekit.android.room.Room

// Call agent RPC from Android
val response = room.localParticipant.performRpc(
    destinationIdentity = "agent-participant",
    method = "pushClientContext",
    payload = """{"battery": 0.95, "os": "Android 15"}"""
)`,
    flutter: `// Flutter SDK (livekit_client)
import 'package:livekit_client/livekit_client.dart';

final response = await room.localParticipant?.performRpc(
  destinationIdentity: 'agent-participant',
  method: 'pushClientContext',
  payload: jsonEncode({'route': '/store/checkout'}),
);`,
    unity: `// Unity 3D SDK (LiveKit Unity WebRTC)
using LiveKit;

var response = await room.LocalParticipant.PerformRpc(
    "agent-participant", 
    "pushClientContext", 
    "{\\"playerScore\\": 4200}"
);`,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
            Exchange Data With Clients: WebRTC RPCs & Data APIs
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Sub-15ms Roundtrip
          </span>
        </div>
        <p className="text-xs text-zinc-500 max-w-3xl">
          Voice agents aren't just audio streams. LiveKit's Data APIs and typed Remote Procedure Calls (RPCs) allow agents and client apps to seamlessly exchange state, screen context, coordinates, and trigger frontend UI actions without extra HTTP servers.
        </p>
      </div>

      {/* Extensive WebRTC SDK Ecosystem */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3">
          Extensive WebRTC Clients & SDK Ecosystem
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'react', name: 'Web & React', icon: <Monitor className="w-3.5 h-3.5" /> },
            { id: 'swift', name: 'iOS (Swift)', icon: <Smartphone className="w-3.5 h-3.5" /> },
            { id: 'kotlin', name: 'Android (Kotlin)', icon: <Smartphone className="w-3.5 h-3.5" /> },
            { id: 'flutter', name: 'Flutter', icon: <Smartphone className="w-3.5 h-3.5" /> },
            { id: 'unity', name: 'Unity 3D', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
          ].map((plat) => (
            <button
              key={plat.id}
              onClick={() => setActivePlatform(plat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activePlatform === plat.id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {plat.icon}
              {plat.name}
            </button>
          ))}
        </div>

        <pre className="bg-zinc-950 text-zinc-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-zinc-800">
          <code>{platformCode[activePlatform]}</code>
        </pre>
      </div>

      {/* Interactive RPC Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Trigger RPC Form */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3">
              Trigger WebRTC Client ⇄ Agent RPC
            </h3>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">RPC Method</label>
                <select
                  value={selectedRpc}
                  onChange={(e) => setSelectedRpc(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="pushClientContext">pushClientContext (Client → Agent)</option>
                  <option value="updateUITheme">updateUITheme (Agent → Client)</option>
                  <option value="requestScreenCapture">requestScreenCapture (Agent → Client)</option>
                  <option value="syncOrderCart">syncOrderCart (Client → Agent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">JSON Payload</label>
                <textarea
                  rows={5}
                  value={rpcPayload}
                  onChange={(e) => setRpcPayload(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSendRpc}
            disabled={executing}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            {executing ? 'Transmitting Data Packet...' : 'Transmit RPC via WebRTC'}
          </button>
        </div>

        {/* Right: Live Data Channel Event Stream */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Live WebRTC Data Channel Packet Monitor
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">
              Protocol: SCTP DataChannels
            </span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
            {rpcHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/70 text-xs font-mono space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.direction === 'client_to_agent'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.direction === 'client_to_agent' ? 'Client → Agent' : 'Agent → Client'}
                    </span>
                    <span className="font-bold text-zinc-900">{item.method}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                    <span className="text-emerald-600 font-semibold">{item.latencyMs}ms RTT</span>
                    <span>{item.timestamp}</span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-600 bg-white p-2 rounded border border-zinc-200/80 overflow-x-auto">
                  Payload: {JSON.stringify(item.payload)}
                </div>

                {item.response && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50/60 p-2 rounded border border-emerald-100 overflow-x-auto">
                    Response: {JSON.stringify(item.response)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
