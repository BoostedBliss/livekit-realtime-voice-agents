import React, { useState } from 'react';
import { 
  Layers, 
  Sparkles, 
  Cpu, 
  Code2, 
  Copy, 
  Check, 
  Sliders, 
  Zap, 
  Mic, 
  Volume2, 
  Radio, 
  Settings2
} from 'lucide-react';
import { PipelineConfig, ModelOption } from '../types';
import { STT_MODELS, LLM_MODELS, TTS_MODELS, REALTIME_MODELS } from '../data/mockData';

interface PipelineArchitectProps {
  pipeline: PipelineConfig;
  onChangePipeline: (newConfig: PipelineConfig) => void;
}

export const PipelineArchitect: React.FC<PipelineArchitectProps> = ({
  pipeline,
  onChangePipeline,
}) => {
  const [copied, setCopied] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<'python' | 'typescript'>('python');

  const update = (patch: Partial<PipelineConfig>) => {
    onChangePipeline({ ...pipeline, ...patch });
  };

  const getPythonCode = () => {
    if (pipeline.mode === 'realtime_api') {
      return `import asyncio
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.plugins import gemini

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Initialize Realtime API voice session
    session = gemini.realtime.RealtimeModel(
        model="${pipeline.realtimeModel}",
        voice="${pipeline.voiceName}",
        temperature=${pipeline.temperature},
        instructions="""${pipeline.systemPrompt}"""
    )

    agent = gemini.multimodal.MultimodalAgent(model=session)
    agent.start(ctx.room)
    await agent.say("Hello! I am connected via LiveKit WebRTC.", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))`;
    }

    return `import asyncio
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import deepgram, openai, cartesia, silero, turn_detector

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Configure flexible mix-and-match voice agent
    agent = VoicePipelineAgent(
        vad=silero.VAD.load(),
        stt=deepgram.STT(model="${pipeline.stt}"),
        llm=openai.LLM(model="${pipeline.llm}"),
        tts=cartesia.TTS(model="${pipeline.tts}"),
        turn_detector=turn_detector.EOUModel(
            threshold=${pipeline.turnDetectionThreshold},
            min_silence_duration=${pipeline.minSilenceDurationMs / 1000}
        ),
        chat_ctx=llm.ChatContext().append(
            role="system",
            text="""${pipeline.systemPrompt}"""
        ),
        allow_interruptions=True,
        interrupt_speech_duration=0.4
    )

    agent.start(ctx.room)
    await agent.say("Connected to LiveKit room. Ready to assist!", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))`;
  };

  const getTypeScriptCode = () => {
    return `import { WorkerOptions, cli } from '@livekit/agents';
import { VoicePipelineAgent } from '@livekit/agents-pipeline';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as cartesia from '@livekit/agents-plugin-cartesia';
import * as silero from '@livekit/agents-plugin-silero';

export default cli.defineAgent({
  entry: async (ctx) => {
    await ctx.connect();

    const agent = new VoicePipelineAgent({
      vad: await silero.VAD.load(),
      stt: new deepgram.STT({ model: '${pipeline.stt}' }),
      tts: new cartesia.TTS({ model: '${pipeline.tts}' }),
      turnDetector: {
        threshold: ${pipeline.turnDetectionThreshold},
        minSilenceDuration: ${pipeline.minSilenceDurationMs},
      },
      instructions: \`${pipeline.systemPrompt}\`,
    });

    agent.start(ctx.room);
  },
});`;
  };

  const handleCopyCode = () => {
    const code = codeLanguage === 'python' ? getPythonCode() : getTypeScriptCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Mode Switch */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Flexible Voice Pipeline Architect
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Mix and match best-in-class Speech-to-Text (STT), Large Language Models (LLM), Text-to-Speech (TTS), or End-to-End Realtime APIs.
            </p>
          </div>

          {/* Mode Switch Pills */}
          <div className="flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
            <button
              onClick={() => update({ mode: 'modular' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pipeline.mode === 'modular'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Modular Stack (STT + LLM + TTS)
            </button>
            <button
              onClick={() => update({ mode: 'realtime_api' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pipeline.mode === 'realtime_api'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Realtime API (Speech-to-Speech)
            </button>
          </div>
        </div>
      </div>

      {pipeline.mode === 'modular' ? (
        /* 3-Column Mix & Match Matrix */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. STT Options */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  1. Speech-to-Text (STT)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Streaming
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {STT_MODELS.map((model) => {
                const isSelected = pipeline.stt === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => update({ stt: model.id })}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                        : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900">{model.name}</span>
                      <span className="text-[10px] font-mono bg-zinc-200/80 px-1.5 py-0.5 rounded text-zinc-700">
                        {model.latencyAvg}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">Provider: {model.provider}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {model.features.slice(0, 2).map((f, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-zinc-200 text-zinc-600">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. LLM Options */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  2. LLM Reasoning
                </h3>
              </div>
              <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Token Stream
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {LLM_MODELS.map((model) => {
                const isSelected = pipeline.llm === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => update({ llm: model.id })}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                        : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900">{model.name}</span>
                      <span className="text-[10px] font-mono bg-zinc-200/80 px-1.5 py-0.5 rounded text-zinc-700">
                        {model.latencyAvg}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">Provider: {model.provider}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {model.features.slice(0, 2).map((f, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-zinc-200 text-zinc-600">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. TTS Options */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  3. Text-to-Speech (TTS)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                Raw PCM
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {TTS_MODELS.map((model) => {
                const isSelected = pipeline.tts === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => update({ tts: model.id })}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-600'
                        : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900">{model.name}</span>
                      <span className="text-[10px] font-mono bg-zinc-200/80 px-1.5 py-0.5 rounded text-zinc-700">
                        {model.latencyAvg}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">Provider: {model.provider}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {model.features.slice(0, 2).map((f, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-zinc-200 text-zinc-600">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Realtime API selector */
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-zinc-900">
              End-to-End Realtime Speech-to-Speech Models
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REALTIME_MODELS.map((m) => {
              const isSelected = pipeline.realtimeModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => update({ realtimeModel: m.id })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/30'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-900">{m.name}</h4>
                    <span className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-700 font-semibold">
                      {m.latencyAvg}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Provider: {m.provider}</p>
                  <div className="mt-3 space-y-1">
                    {m.features.map((f, i) => (
                      <div key={i} className="text-xs text-zinc-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Voice Tuning & Agent Parameters */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-zinc-700" />
          Turn Detection, VAD & Interruption Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Turn Detector Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Turn Detector Model
            </label>
            <select
              value={pipeline.vadModel}
              onChange={(e) => update({ vadModel: e.target.value as any })}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="transformer_turn_detector">LiveKit Transformer Turn Detector (Recommended)</option>
              <option value="silero_vad">Silero VAD (Energy Silence Baseline)</option>
            </select>
            <p className="text-[11px] text-zinc-500 mt-1">
              Transformer turn detection analyses linguistic intent to reduce unwanted interruptions.
            </p>
          </div>

          {/* Turn Detection Confidence Threshold */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 mb-1.5">
              <span>Turn Completion Threshold</span>
              <span className="font-mono text-indigo-600">{pipeline.turnDetectionThreshold}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={pipeline.turnDetectionThreshold}
              onChange={(e) => update({ turnDetectionThreshold: parseFloat(e.target.value) })}
              className="w-full accent-zinc-900"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              <span>0.50 (Aggressive)</span>
              <span>0.85 (Balanced)</span>
              <span>0.99 (Wait Long)</span>
            </div>
          </div>

          {/* Interruption Sensitivity */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Barge-in Interruption Sensitivity
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['low', 'balanced', 'high'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => update({ interruptionSensitivity: s })}
                  className={`py-1.5 rounded-lg text-xs capitalize font-medium border transition-all ${
                    pipeline.interruptionSensitivity === s
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Balanced stops TTS output within 50ms upon genuine user speech.
            </p>
          </div>
        </div>

        {/* System Prompt & Persona */}
        <div className="mt-5 pt-5 border-t border-zinc-100">
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Agent System Prompt & Instructions
          </label>
          <textarea
            rows={2}
            value={pipeline.systemPrompt}
            onChange={(e) => update({ systemPrompt: e.target.value })}
            className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
          />
        </div>
      </div>

      {/* Production Code Generator */}
      <div className="bg-zinc-950 text-white rounded-xl p-6 shadow-xs border border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Production-Ready Worker Code Generator
              </h3>
              <p className="text-xs text-zinc-400">
                Self-hostable code matching your exact pipeline configuration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-0.5 bg-zinc-900 rounded-lg border border-zinc-800">
              <button
                onClick={() => setCodeLanguage('python')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  codeLanguage === 'python' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Python (livekit-agents)
              </button>
              <button
                onClick={() => setCodeLanguage('typescript')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  codeLanguage === 'typescript' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                TypeScript (@livekit/agents)
              </button>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
          </div>
        </div>

        <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-xs font-mono text-zinc-300 border border-zinc-800/80 leading-relaxed max-h-72">
          <code>{codeLanguage === 'python' ? getPythonCode() : getTypeScriptCode()}</code>
        </pre>
      </div>
    </div>
  );
};
