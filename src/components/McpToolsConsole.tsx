import React, { useState } from 'react';
import { 
  Wrench, 
  Server, 
  Plus, 
  Play, 
  CheckCircle2, 
  Code2, 
  Database, 
  Calendar, 
  Github, 
  ArrowRight,
  Terminal
} from 'lucide-react';
import { McpServerConfig } from '../types';

interface McpToolsConsoleProps {
  mcpServers: McpServerConfig[];
  onAddServer: (server: McpServerConfig) => void;
}

export const McpToolsConsole: React.FC<McpToolsConsoleProps> = ({
  mcpServers,
  onAddServer,
}) => {
  const [selectedTool, setSelectedTool] = useState('postgres_query');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // New server modal form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerEndpoint, setNewServerEndpoint] = useState('');
  const [newServerDesc, setNewServerDesc] = useState('');

  const handleTestTool = async () => {
    setExecuting(true);
    try {
      const res = await fetch('/api/mcp/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: selectedTool,
          server: 'postgres-mcp',
          args: { query: 'SELECT * FROM enterprise_customers LIMIT 3' },
        }),
      });
      const data = await res.json();
      setExecutionResult(data);
    } catch (err) {
      console.error('Failed to run MCP tool:', err);
    } finally {
      setExecuting(false);
    }
  };

  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName || !newServerEndpoint) return;

    const newServer: McpServerConfig = {
      id: 'mcp-' + Date.now(),
      name: newServerName,
      endpoint: newServerEndpoint,
      description: newServerDesc || 'Custom Model Context Protocol server',
      status: 'connected',
      tools: [
        {
          name: newServerName.toLowerCase().replace(/\s+/g, '_') + '_action',
          description: 'Auto-discovered tool from ' + newServerName,
          parameters: ['query: string', 'timeoutMs?: number'],
        },
      ],
    };

    onAddServer(newServer);
    setNewServerName('');
    setNewServerEndpoint('');
    setNewServerDesc('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                Model Context Protocol (MCP) Support
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                Native 1-Line Integration
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Integrate external tools, databases, APIs, and business systems into your LiveKit voice agent using open MCP servers with a single line of code.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Connect MCP Server
          </button>
        </div>

        {/* 1-Line Code Banner */}
        <div className="mt-4 p-3 bg-zinc-900 rounded-lg text-xs font-mono text-zinc-300 flex items-center justify-between overflow-x-auto border border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-purple-400"># 1-Line Python Integration:</span>
            <code className="text-zinc-100">agent.add_mcp_server(MCPServer(url="http://postgres-mcp:8000"))</code>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold hidden sm:inline">
            Zero boilerplate
          </span>
        </div>
      </div>

      {/* Add Server Modal Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border-2 border-purple-300 p-5 shadow-md">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Connect New MCP Server</h3>
          <form onSubmit={handleCreateServer} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Server Name</label>
                <input
                  type="text"
                  placeholder="e.g. Zendesk CRM MCP"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Endpoint (SSE or HTTP)</label>
                <input
                  type="text"
                  placeholder="e.g. http://zendesk-mcp.internal:8000/sse"
                  value={newServerEndpoint}
                  onChange={(e) => setNewServerEndpoint(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="Lookup customer tickets and update conversation notes"
                value={newServerDesc}
                onChange={(e) => setNewServerDesc(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Connect Server
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Connected Servers List & Tool Invocation Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Connected MCP Servers */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
            Connected MCP Server Registry ({mcpServers.length})
          </h3>

          <div className="space-y-3">
            {mcpServers.map((server) => (
              <div
                key={server.id}
                className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold text-zinc-900">{server.name}</h4>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Connected
                  </span>
                </div>

                <div className="text-[11px] text-zinc-500 mt-1.5 font-mono">{server.endpoint}</div>
                <p className="text-xs text-zinc-600 mt-1">{server.description}</p>

                {/* Registered tools */}
                <div className="mt-3 pt-2 border-t border-zinc-100">
                  <span className="text-[11px] font-semibold text-zinc-500 block mb-1">Exported Tools:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {server.tools.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTool(t.name)}
                        className={`text-[11px] font-mono px-2 py-1 rounded border transition-colors ${
                          selectedTool === t.name
                            ? 'bg-purple-100 border-purple-300 text-purple-800 font-bold'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {t.name}()
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live MCP Tool Invoker & Inspector */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-zinc-700" />
              Live MCP Tool Call Inspector
            </h3>

            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs mb-4">
              <span className="text-zinc-500 block text-[11px]">Selected Tool:</span>
              <span className="font-mono font-bold text-purple-700 text-sm">{selectedTool}</span>
              <p className="text-zinc-500 text-[11px] mt-1">
                The agent invokes this tool automatically when users ask questions requiring external data (e.g. database orders, GitHub issues, calendar events).
              </p>
            </div>

            <button
              onClick={handleTestTool}
              disabled={executing}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              {executing ? 'Executing MCP RPC...' : `Execute ${selectedTool}()`}
            </button>

            {/* Execution Result */}
            {executionResult && (
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-800">Tool Result Payload:</span>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    Latency: {executionResult.durationMs}ms
                  </span>
                </div>
                <pre className="bg-zinc-950 text-emerald-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
                  <code>{JSON.stringify(executionResult.result, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500">
            ✅ LiveKit Agents supports standard JSON-RPC 2.0 and SSE MCP transport out of the box.
          </div>
        </div>
      </div>
    </div>
  );
};
