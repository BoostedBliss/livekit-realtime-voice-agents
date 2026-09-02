import React from 'react';
import { 
  Radio, 
  Layers, 
  BrainCircuit, 
  PhoneCall, 
  Wrench, 
  ArrowLeftRight, 
  Server, 
  ClipboardCheck, 
  Cpu, 
  CheckCircle2
} from 'lucide-react';

export type TabId = 
  | 'sandbox' 
  | 'architect' 
  | 'turn_detection' 
  | 'telephony' 
  | 'mcp' 
  | 'rpc' 
  | 'scheduler' 
  | 'evals' 
  | 'self_host';

interface HeaderProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isCallActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, isCallActive }) => {
  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'sandbox', label: 'Voice Sandbox', icon: <Radio className="w-4 h-4" /> },
    { id: 'architect', label: 'Pipeline Architect', icon: <Layers className="w-4 h-4" /> },
    { id: 'turn_detection', label: 'Semantic Turn Detection', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'telephony', label: 'SIP Telephony', icon: <PhoneCall className="w-4 h-4" />, badge: isCallActive ? 'Live' : undefined },
    { id: 'mcp', label: 'MCP Support', icon: <Wrench className="w-4 h-4" /> },
    { id: 'rpc', label: 'Data & RPC APIs', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'scheduler', label: 'Job Scheduling', icon: <Server className="w-4 h-4" /> },
    { id: 'evals', label: 'Evals & Judges', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'self_host', label: 'Open-Source Stack', icon: <Cpu className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold shadow-xs">
            <Radio className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-zinc-900 tracking-tight">
                LiveKit Voice Agent Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Open-Source Stack
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              End-to-end WebRTC voice agents • Semantic turn detection • Telephony SIP • Native MCP
            </p>
          </div>
        </div>

        {/* Live Cluster Health Indicators */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 rounded-md text-zinc-700 border border-zinc-200/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">LiveKit SFU:</span>
            <span className="text-zinc-500">0.0.0.0:7880</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 rounded-md text-zinc-700 border border-zinc-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium">SIP Trunk:</span>
            <span className="text-zinc-500">Twilio Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 text-zinc-200 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Workers: <strong>4 Online</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 border-t border-zinc-100 py-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
