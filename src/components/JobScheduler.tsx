import React, { useState, useMemo } from 'react';
import { 
  Server, 
  Cpu, 
  Layers, 
  Plus, 
  CheckCircle2, 
  Activity, 
  Zap, 
  Globe, 
  Clock, 
  ArrowRight
} from 'lucide-react';
import { DispatchWorker } from '../types';
import { INITIAL_WORKERS } from '../data/mockData';

export const JobScheduler: React.FC = () => {
  const [workers, setWorkers] = useState<DispatchWorker[]>(INITIAL_WORKERS);

  // ⚡ Bolt Optimization: Memoize the capacity calculations and consolidate two reduce passes
  // into a single O(N) pass to prevent expensive recalculations on unrelated re-renders.
  const { totalActiveRooms, totalMaxRooms } = useMemo(() => {
    return workers.reduce((acc, w) => ({
      totalActiveRooms: acc.totalActiveRooms + w.activeRooms,
      totalMaxRooms: acc.totalMaxRooms + w.maxRooms,
    }), { totalActiveRooms: 0, totalMaxRooms: 0 });
  }, [workers]);

  const [roomName, setRoomName] = useState('call-center-vip-884');
  const [agentType, setAgentType] = useState('customer-support-agent');
  const [priority, setPriority] = useState<'normal' | 'high' | 'vip'>('high');
  const [dispatches, setDispatches] = useState<Array<{
    id: string;
    room: string;
    agent: string;
    workerId: string;
    priority: string;
    status: string;
    timestamp: string;
  }>>([
    {
      id: 'disp-901',
      room: 'room-demo-8491',
      agent: 'voice-pipeline-worker',
      workerId: 'worker-us-west-1',
      priority: 'high',
      status: 'dispatched',
      timestamp: '13:18:22',
    },
    {
      id: 'disp-902',
      room: 'sip-inbound-4029',
      agent: 'sip-telephony-agent',
      workerId: 'worker-us-east-1',
      priority: 'normal',
      status: 'active',
      timestamp: '13:19:04',
    },
  ]);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName) return;

    // Pick worker with lowest load ratio
    const eligibleWorkers = [...workers].sort(
      (a, b) => a.activeRooms / a.maxRooms - b.activeRooms / b.maxRooms
    );
    const assignedWorker = eligibleWorkers[0];

    const newDispatch = {
      id: 'disp-' + Math.floor(Math.random() * 9000 + 1000),
      room: roomName,
      agent: agentType,
      workerId: assignedWorker.id,
      priority,
      status: 'assigned',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setDispatches((prev) => [newDispatch, ...prev]);

    // Update worker stats
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === assignedWorker.id ? { ...w, activeRooms: w.activeRooms + 1 } : w
      )
    );

    setRoomName('room-session-' + Math.floor(Math.random() * 9000 + 1000));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                Integrated Job Scheduling & Dispatch APIs
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Worker Pool Load Balancing
              </span>
            </div>
            <p className="text-xs text-zinc-500 max-w-3xl">
              LiveKit includes automated task distribution. When users connect via WebRTC or a SIP phone call arrives, the dispatch API matches end users to available agents based on capacity, skills, and geo-affinity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 bg-zinc-100 rounded-md text-zinc-700 font-mono border border-zinc-200">
              Redis Pub/Sub: Active
            </span>
          </div>
        </div>
      </div>

      {/* Global Worker Pool */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Active Agent Worker Pool ({workers.length} nodes)</span>
          <span className="text-[11px] font-normal text-zinc-500 font-mono">
            Total Capacity: {totalActiveRooms} / {totalMaxRooms} Rooms
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workers.map((w) => {
            const utilizationPct = Math.round((w.activeRooms / w.maxRooms) * 100);
            return (
              <div
                key={w.id}
                className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-zinc-700" />
                    <span className="text-xs font-bold text-zinc-900">{w.name}</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>

                <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-zinc-400" />
                  {w.region}
                </div>

                {/* Utilization Progress */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-600 mb-1">
                    <span>Active Rooms</span>
                    <span>{w.activeRooms} / {w.maxRooms} ({utilizationPct}%)</span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        utilizationPct > 80 ? 'bg-rose-500' : utilizationPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-200/80 font-mono">
                  <span>CPU: {w.cpuPct}%</span>
                  <span>RAM: {w.memoryMb} MB</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dispatch Trigger & Live Dispatch History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dispatch Form */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3">
              Trigger Room Dispatch API
            </h3>

            <form onSubmit={handleDispatch} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Agent Package</label>
                <select
                  value={agentType}
                  onChange={(e) => setAgentType(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="customer-support-agent">Customer Support Agent (Python / Cartesia)</option>
                  <option value="telephony-sip-ivr">SIP Telephony IVR Agent (Go / G.711)</option>
                  <option value="realtime-multimodal-agent">Multimodal Realtime Agent (Node.js)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Queue Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'high', 'vip'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-1.5 rounded-lg text-xs capitalize font-medium border transition-all ${
                        priority === p
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Dispatch Agent to Room
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 font-mono">
            POST /api/dispatch/room • Status: 200 OK
          </div>
        </div>

        {/* Right: Live Dispatches Stream */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3">
            Recent Task Dispatches & Allocation History
          </h3>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {dispatches.map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900">{d.room}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                        d.priority === 'vip'
                          ? 'bg-purple-100 text-purple-800'
                          : d.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {d.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Agent: {d.agent} → Node: <span className="text-indigo-600 font-semibold">{d.workerId}</span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-zinc-400">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {d.status}
                  </span>
                  <div className="mt-1">{d.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
