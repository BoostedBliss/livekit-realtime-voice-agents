import React, { useState } from 'react';
import { Header, TabId } from './components/Header';
import { VoiceSandbox } from './components/VoiceSandbox';
import { PipelineArchitect } from './components/PipelineArchitect';
import { TurnDetectionLab } from './components/TurnDetectionLab';
import { TelephonySipHub } from './components/TelephonySipHub';
import { McpToolsConsole } from './components/McpToolsConsole';
import { RpcDataExchange } from './components/RpcDataExchange';
import { JobScheduler } from './components/JobScheduler';
import { TestFrameworkJudge } from './components/TestFrameworkJudge';
import { SelfHostHub } from './components/SelfHostHub';
import { PipelineConfig, McpServerConfig } from './types';
import { DEFAULT_PIPELINE, INITIAL_MCP_SERVERS } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('sandbox');
  const [pipeline, setPipeline] = useState<PipelineConfig>(DEFAULT_PIPELINE);
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>(INITIAL_MCP_SERVERS);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);

  const handleAddMcpServer = (newServer: McpServerConfig) => {
    setMcpServers((prev) => [...prev, newServer]);
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* Platform Navigation Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCallActive={isCallActive}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'sandbox' && (
          <VoiceSandbox
            pipeline={pipeline}
            mcpServers={mcpServers}
            onOpenArchitect={() => setActiveTab('architect')}
            onOpenTurnLab={() => setActiveTab('turn_detection')}
          />
        )}

        {activeTab === 'architect' && (
          <PipelineArchitect
            pipeline={pipeline}
            onChangePipeline={setPipeline}
          />
        )}

        {activeTab === 'turn_detection' && (
          <TurnDetectionLab />
        )}

        {activeTab === 'telephony' && (
          <TelephonySipHub
            onCallStatusChange={setIsCallActive}
          />
        )}

        {activeTab === 'mcp' && (
          <McpToolsConsole
            mcpServers={mcpServers}
            onAddServer={handleAddMcpServer}
          />
        )}

        {activeTab === 'rpc' && (
          <RpcDataExchange />
        )}

        {activeTab === 'scheduler' && (
          <JobScheduler />
        )}

        {activeTab === 'evals' && (
          <TestFrameworkJudge />
        )}

        {activeTab === 'self_host' && (
          <SelfHostHub />
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-zinc-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800">LiveKit Open-Source Voice Agent Framework</span>
            <span>•</span>
            <span>WebRTC Media Server &amp; Distributed Workers</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('self_host')}
              className="hover:text-zinc-900 transition-colors"
            >
              Docker &amp; Kubernetes
            </button>
            <button
              onClick={() => setActiveTab('evals')}
              className="hover:text-zinc-900 transition-colors"
            >
              Test Evals
            </button>
            <button
              onClick={() => setActiveTab('turn_detection')}
              className="hover:text-zinc-900 transition-colors"
            >
              Transformer VAD
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
