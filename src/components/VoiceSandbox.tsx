import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Square, 
  Send, 
  Sparkles, 
  Zap, 
  Clock, 
  Activity, 
  ShieldAlert, 
  PhoneOff, 
  Layers,
  Wrench,
  Radio,
  RotateCcw,
  BrainCircuit
} from 'lucide-react';
import { PipelineConfig, ChatMessage, McpServerConfig } from '../types';

interface VoiceSandboxProps {
  pipeline: PipelineConfig;
  mcpServers: McpServerConfig[];
  onOpenArchitect: () => void;
  onOpenTurnLab: () => void;
}

export const VoiceSandbox: React.FC<VoiceSandboxProps> = ({
  pipeline,
  mcpServers,
  onOpenArchitect,
  onOpenTurnLab,
}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isMicActive, setIsMicActive] = useState(false);
  const [agentState, setAgentState] = useState<'listening' | 'evaluating_turn' | 'thinking' | 'speaking'>('listening');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: "Hi there! I'm your LiveKit realtime voice agent. I'm connected over WebRTC with sub-500ms latency. Try speaking into your mic or click a quick prompt below!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      metrics: {
        sttMs: 0,
        turnDetectMs: 0,
        llmTtftMs: 140,
        ttsTtfbMs: 85,
        totalMs: 225,
      },
    },
  ]);
  const [turnProbability, setTurnProbability] = useState<number>(0.1);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [lastMetrics, setLastMetrics] = useState({
    sttMs: 110,
    turnDetectMs: 32,
    llmTtftMs: 210,
    ttsTtfbMs: 95,
    totalMs: 447,
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentState]);

  // Handle real microphone with Web Audio Analyser
  useEffect(() => {
    if (isMicActive) {
      startMicrophone();
    } else {
      stopMicrophone();
    }
    return () => {
      stopMicrophone();
    };
  }, [isMicActive]);

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        // If speaking above threshold, update turn detector state
        if (normalized > 25) {
          setTurnProbability(0.25);
          if (agentState === 'speaking') {
            // User interrupted the agent (barge-in!)
            handleBargeInInterruption();
          } else {
            setAgentState('listening');
          }
        } else if (normalized <= 10 && turnProbability === 0.25) {
          setTurnProbability(0.85);
        }

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn('Microphone permission not granted or unavailable:', err);
      setIsMicActive(false);
    }
  };

  const stopMicrophone = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // Barge-in interruption handler
  const handleBargeInInterruption = () => {
    // Cut off TTS speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAgentState('listening');
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.role === 'assistant' && !last.interrupted) {
        return [
          ...prev.slice(0, -1),
          { ...last, interrupted: true, content: last.content + ' [—interrupted by user]' },
        ];
      }
      return prev;
    });
  };

  // Speak response using browser speech synthesis for interactive voice feedback
  const playAgentAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        setAgentState('speaking');
      };
      utterance.onend = () => {
        setAgentState('listening');
      };
      utterance.onerror = () => {
        setAgentState('listening');
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setAgentState('speaking');
      setTimeout(() => setAgentState('listening'), 2500);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setInputText('');
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Add user message
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: userTimestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setAgentState('evaluating_turn');

    // Run semantic turn detection
    try {
      const turnRes = await fetch('/api/turn-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const turnData = await turnRes.json();
      setTurnProbability(turnData.probability ?? 0.95);
    } catch {
      setTurnProbability(0.92);
    }

    setAgentState('thinking');

    // Send to agent API
    try {
      const activeTools = mcpServers.flatMap((s) => s.tools);
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          pipeline,
          systemPrompt: pipeline.systemPrompt,
          mcpTools: activeTools,
        }),
      });

      const data = await res.json();
      const metrics = data.metrics || {
        sttMs: 110,
        turnDetectMs: 28,
        llmTtftMs: 190,
        ttsTtfbMs: 90,
        totalMs: 418,
      };

      setLastMetrics(metrics);

      const assistantMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: data.reply || 'I am processing your voice stream.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        metrics,
        toolCalls: data.toolCalls,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      playAgentAudio(assistantMsg.content);
    } catch (err) {
      console.error('Failed to communicate with agent:', err);
      setAgentState('listening');
    }
  };

  const quickPrompts = [
    { label: 'Check Order #LK-9821 (MCP Tool)', text: 'Can you check the shipping status for order #LK-9821?' },
    { label: 'Current Weather in SF (Tool Call)', text: "What's the current weather and wind speed in San Francisco?" },
    { label: 'Incomplete Thought (Turn Pause)', text: 'I would like to look up reservations for next Friday but... um...' },
    { label: 'Return Policy Query', text: 'What is your returns and refund policy for open box items?' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: WebRTC Room & Pipeline info */}
      <div className="bg-zinc-950 text-white rounded-xl p-5 shadow-xs border border-zinc-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                WebRTC Live Room: <code className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-emerald-300 font-mono">room-agents-7880-usw2</code>
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                ICE: Connected (SRTP)
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Active Pipeline: <strong className="text-zinc-200">{pipeline.stt}</strong> (STT) → <strong className="text-zinc-200">{pipeline.vadModel}</strong> → <strong className="text-zinc-200">{pipeline.llm}</strong> (LLM) → <strong className="text-zinc-200">{pipeline.tts}</strong> (TTS)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenArchitect}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors border border-zinc-700"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Configure Pipeline
            </button>
            <button
              onClick={onOpenTurnLab}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors border border-zinc-700"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Turn Detection Lab
            </button>
          </div>
        </div>

        {/* Realtime End-to-End Latency Bar */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-zinc-900/90 rounded-lg p-2.5 border border-zinc-800">
            <div className="text-zinc-500 text-[11px] font-medium">1. STT Inbound</div>
            <div className="text-sm font-semibold text-zinc-200 font-mono mt-0.5">{lastMetrics.sttMs}ms</div>
            <div className="text-[10px] text-zinc-400 truncate">{pipeline.stt}</div>
          </div>
          <div className="bg-zinc-900/90 rounded-lg p-2.5 border border-zinc-800">
            <div className="text-zinc-500 text-[11px] font-medium">2. Semantic Turn VAD</div>
            <div className="text-sm font-semibold text-emerald-400 font-mono mt-0.5">{lastMetrics.turnDetectMs}ms</div>
            <div className="text-[10px] text-zinc-400 truncate">Transformer Model</div>
          </div>
          <div className="bg-zinc-900/90 rounded-lg p-2.5 border border-zinc-800">
            <div className="text-zinc-500 text-[11px] font-medium">3. LLM TTFT</div>
            <div className="text-sm font-semibold text-indigo-300 font-mono mt-0.5">{lastMetrics.llmTtftMs}ms</div>
            <div className="text-[10px] text-zinc-400 truncate">{pipeline.llm}</div>
          </div>
          <div className="bg-zinc-900/90 rounded-lg p-2.5 border border-zinc-800">
            <div className="text-zinc-500 text-[11px] font-medium">4. TTS TTFB</div>
            <div className="text-sm font-semibold text-amber-300 font-mono mt-0.5">{lastMetrics.ttsTtfbMs}ms</div>
            <div className="text-[10px] text-zinc-400 truncate">{pipeline.tts}</div>
          </div>
          <div className="bg-zinc-900/90 rounded-lg p-2.5 border border-zinc-800 col-span-2 sm:col-span-1">
            <div className="text-zinc-500 text-[11px] font-medium">Total Voice Roundtrip</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">{lastMetrics.totalMs}ms</div>
            <div className="text-[10px] text-emerald-500/80 font-medium">Ultra-low latency</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Voice Interaction Panel & Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Voice Visualizer, Controls, and Turn Meter */}
        <div className="lg:col-span-5 space-y-4">
          {/* Visual Voice Activity Card */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Status Pill */}
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                agentState === 'speaking' 
                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                  : agentState === 'thinking' 
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                  : agentState === 'evaluating_turn'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  agentState === 'speaking' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                }`}></span>
                {agentState === 'speaking' && 'Agent Speaking (TTS)'}
                {agentState === 'thinking' && 'LLM Streaming...'}
                {agentState === 'evaluating_turn' && 'Transformer Turn Analysis'}
                {agentState === 'listening' && 'Listening (WebRTC Mic)'}
              </span>
            </div>

            {/* Audio Waveform Avatar */}
            <div className="my-8 flex items-center justify-center">
              <div className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-300 ${
                agentState === 'speaking'
                  ? 'bg-amber-50 ring-8 ring-amber-100/80 scale-105'
                  : isMicActive
                  ? 'bg-emerald-50 ring-8 ring-emerald-100/80'
                  : 'bg-zinc-100 ring-4 ring-zinc-200/50'
              }`}>
                {/* Visualizer Pulsing Bars */}
                <div className="flex items-center gap-1.5 h-14">
                  {[30, 65, 95, 45, 80, 50, 90, 40].map((h, i) => {
                    const barHeight = agentState === 'speaking'
                      ? Math.max(16, (h * (0.5 + Math.random() * 0.5)))
                      : isMicActive && audioLevel > 15
                      ? Math.max(12, (audioLevel * (h / 70)))
                      : 10;
                    return (
                      <span
                        key={i}
                        style={{ height: `${barHeight}px` }}
                        className={`w-1.5 rounded-full transition-all duration-150 ${
                          agentState === 'speaking'
                            ? 'bg-amber-500'
                            : isMicActive && audioLevel > 15
                            ? 'bg-emerald-500'
                            : 'bg-zinc-300'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mic Toggle & Barge-in Controls */}
            <div className="flex items-center gap-3">
              <button
                id="toggle-mic-btn"
                onClick={() => setIsMicActive(!isMicActive)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-xs ${
                  isMicActive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                }`}
              >
                {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                {isMicActive ? 'Mute Mic' : 'Start Mic (WebRTC)'}
              </button>

              {/* Barge-in Interruption Test Button */}
              <button
                id="barge-in-btn"
                onClick={handleBargeInInterruption}
                disabled={agentState !== 'speaking'}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  agentState === 'speaking'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 animate-pulse cursor-pointer'
                    : 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                }`}
                title="Interrupt the agent while speaking (barge-in)"
              >
                <ShieldAlert className="w-4 h-4" />
                Barge-In Interrupt
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 mt-3">
              {isMicActive ? 'Microphone audio streaming over WebRTC peer connection' : 'Click "Start Mic" to enable live microphone audio or use the text prompt below'}
            </p>
          </div>

          {/* Semantic Turn Detection Live Meter */}
          <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-zinc-800">Transformer Turn Completion Meter</span>
              </div>
              <span className="text-xs font-mono font-bold text-purple-700">
                {Math.round(turnProbability * 100)}%
              </span>
            </div>

            <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  turnProbability > 0.8
                    ? 'bg-emerald-500'
                    : turnProbability > 0.5
                    ? 'bg-amber-500'
                    : 'bg-purple-500'
                }`}
                style={{ width: `${Math.round(turnProbability * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
              <span>0% (Mid-sentence thought)</span>
              <span className="font-semibold text-zinc-700">Threshold: {Math.round(pipeline.turnDetectionThreshold * 100)}%</span>
              <span>100% (Turn Finished)</span>
            </div>

            <p className="text-[11px] text-zinc-500 mt-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
              💡 <strong>How it works:</strong> Rather than a crude silence timer that cuts users off mid-pause, LiveKit's semantic turn detector uses a fine-tuned transformer to predict grammatical completion.
            </p>
          </div>

          {/* Quick Prompts */}
          <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
            <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Simulate Voice Turns
            </h3>
            <div className="space-y-1.5">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.text)}
                  className="w-full text-left p-2.5 rounded-lg text-xs bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/70 text-zinc-800 transition-colors flex items-start justify-between gap-2"
                >
                  <span className="font-medium text-zinc-700">{p.label}</span>
                  <span className="text-[10px] text-zinc-400 truncate max-w-[140px] italic">"{p.text}"</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Transcript & Messages */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-xl border border-zinc-200 shadow-xs h-[560px] overflow-hidden">
          {/* Transcript Header */}
          <div className="p-3.5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-zinc-800">Live Agent WebRTC Dialogue</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-mono">
                {messages.length} turns
              </span>
            </div>

            <button
              onClick={() => setMessages([])}
              className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-200/60 transition-colors"
              title="Clear transcript"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1 px-1">
                    <span className="font-medium text-zinc-600">{isUser ? 'You (End User)' : 'Voice Agent'}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                    {m.interrupted && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        Interrupted
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-zinc-900 text-white rounded-tr-xs shadow-xs'
                        : 'bg-zinc-100 text-zinc-800 rounded-tl-xs border border-zinc-200/80'
                    }`}
                  >
                    <p>{m.content}</p>

                    {/* Tool Call Chips if triggered */}
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-zinc-200 space-y-1">
                        {m.toolCalls.map((t, idx) => (
                          <div key={idx} className="bg-white p-2 rounded border border-zinc-200 text-[11px]">
                            <div className="flex items-center gap-1.5 font-mono font-semibold text-purple-700">
                              <Wrench className="w-3 h-3 text-purple-600" />
                              <span>MCP Tool: {t.name}</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                              args: {JSON.stringify(t.args)}
                            </div>
                            <div className="text-[10px] text-emerald-700 mt-0.5 font-mono bg-emerald-50 p-1 rounded">
                              result: {t.result}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Latency badge on assistant message */}
                    {!isUser && m.metrics && (
                      <div className="mt-2 pt-1.5 border-t border-zinc-200/70 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <Zap className="w-3 h-3 text-emerald-600" />
                          Roundtrip: {m.metrics.totalMs}ms
                        </span>
                        <span className="text-zinc-500">
                          LLM TTFT: {m.metrics.llmTtftMs}ms | TTS TTFB: {m.metrics.ttsTtfbMs}ms
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* In-progress agent status badge */}
            {agentState !== 'listening' && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 p-2 rounded-lg border border-zinc-200/60 max-w-fit">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {agentState === 'evaluating_turn' && 'Analyzing semantic turn completion...'}
                {agentState === 'thinking' && 'Streaming LLM completion tokens...'}
                {agentState === 'speaking' && 'Speaking audio stream via WebRTC track...'}
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Text Input Footer */}
          <div className="p-3 border-t border-zinc-200 bg-zinc-50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                id="voice-chat-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a spoken utterance or click prompts above..."
                className="flex-1 bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder:text-zinc-400"
              />
              <button
                type="submit"
                id="send-voice-input-btn"
                disabled={!inputText.trim() || agentState !== 'listening'}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Speak
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
