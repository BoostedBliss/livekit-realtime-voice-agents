import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sliders, 
  HelpCircle,
  Play,
  Layers,
  ArrowRight
} from 'lucide-react';

export const TurnDetectionLab: React.FC = () => {
  const [testUtterance, setTestUtterance] = useState('I need to book a flight to Tokyo departing next Monday morning.');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    complete: boolean;
    probability: number;
    status: string;
    reason: string;
    latencyMs: number;
  }>({
    complete: true,
    probability: 0.96,
    status: 'turn_completed',
    reason: 'Syntactic clause closed with clear destination and date specification',
    latencyMs: 24,
  });

  const benchmarkPhrases = [
    {
      type: 'incomplete',
      text: "I was looking at the pricing page and wondering if you...",
      expected: 'Wait (Incomplete)',
    },
    {
      type: 'filler',
      text: "Could you check my reservation status for... ummm...",
      expected: 'Wait (Filler detected)',
    },
    {
      type: 'complete',
      text: "What is your return policy for refurbished hardware?",
      expected: 'Complete (Respond)',
    },
    {
      type: 'question',
      text: "Can I transfer this ticket to another passenger name?",
      expected: 'Complete (Respond)',
    },
    {
      type: 'incomplete',
      text: "Let me check my calendar to see if Friday works, because...",
      expected: 'Wait (Trailing conjunction)',
    },
  ];

  const handleAnalyze = async (phraseToAnalyze?: string) => {
    const text = phraseToAnalyze || testUtterance;
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/turn-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Turn detect error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
            Semantic Turn Detection Lab
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Transformer EOU Model
          </span>
        </div>
        <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed">
          Standard voice bots rely on simple silence timeouts (e.g. 500ms of silence = user finished). This causes rampant user frustration when people pause to think or hesitate. LiveKit's semantic turn detector uses a fine-tuned transformer model to evaluate linguistic completion before handing the turn to the LLM.
        </p>
      </div>

      {/* Comparison: Naive Silence Timeout vs Semantic Turn Detection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Naive VAD */}
        <div className="bg-rose-50/50 rounded-xl border border-rose-200 p-5">
          <div className="flex items-center gap-2 mb-2 text-rose-800">
            <XCircle className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Traditional Silence VAD (Flawed)</h3>
          </div>
          <p className="text-xs text-rose-900/80 mb-3">
            Measures audio amplitude only. If user stops making sound for 400ms, agent interrupts immediately.
          </p>
          <div className="bg-white/80 p-3 rounded-lg border border-rose-200 text-xs space-y-2 font-mono text-zinc-700">
            <div>User: "I need to ship to..." [400ms pause]</div>
            <div className="text-rose-600 font-semibold">❌ Agent interrupts: "Where would you like to ship?"</div>
            <div className="text-zinc-500 italic">User: "...Chicago! Stop interrupting me!"</div>
          </div>
          <div className="mt-3 text-[11px] text-rose-700 font-medium">
            Result: High interruption rate, awkward conversational friction.
          </div>
        </div>

        {/* Transformer Turn Detection */}
        <div className="bg-emerald-50/50 rounded-xl border border-emerald-200 p-5">
          <div className="flex items-center gap-2 mb-2 text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Transformer Semantic Turn Detector</h3>
          </div>
          <p className="text-xs text-emerald-900/80 mb-3">
            Understands grammar, filler tokens, conjunctions, and intonation contour in real-time.
          </p>
          <div className="bg-white/80 p-3 rounded-lg border border-emerald-200 text-xs space-y-2 font-mono text-zinc-700">
            <div>User: "I need to ship to..." [400ms pause]</div>
            <div className="text-purple-600 font-semibold">⚡ Transformer: 18% complete → Wait for closure</div>
            <div>User: "...Chicago next Monday morning."</div>
            <div className="text-emerald-600 font-semibold">✅ Agent: "Got it! Chicago by Monday morning."</div>
          </div>
          <div className="mt-3 text-[11px] text-emerald-700 font-medium">
            Result: Natural human pacing, zero rude interruptions.
          </div>
        </div>
      </div>

      {/* Interactive Utterance Tester */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-700" />
          Test Linguistic Turn Completion
        </h3>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={testUtterance}
              onChange={(e) => setTestUtterance(e.target.value)}
              placeholder="Enter a speech utterance to test turn completion probability..."
              className="flex-1 bg-zinc-50 border border-zinc-300 rounded-lg px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={isLoading || !testUtterance.trim()}
              className="px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              {isLoading ? 'Evaluating...' : 'Run Turn Model'}
            </button>
          </div>

          {/* Preset Benchmark Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-zinc-500">Quick Test Cases:</span>
            {benchmarkPhrases.map((phrase, i) => (
              <button
                key={i}
                onClick={() => {
                  setTestUtterance(phrase.text);
                  handleAnalyze(phrase.text);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5 ${
                  phrase.type === 'incomplete' || phrase.type === 'filler'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <span>"{phrase.text.slice(0, 30)}..."</span>
                <span className="text-[10px] font-mono text-zinc-500 font-medium">({phrase.expected})</span>
              </button>
            ))}
          </div>

          {/* Model Evaluation Output Display */}
          {result && (
            <div className="mt-4 p-5 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      result.complete
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {result.complete ? 'Turn Finished (Trigger LLM)' : 'User Mid-Thought (Hold / Wait)'}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    Model inference: {result.latencyMs || 24}ms
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Completion Probability:</span>
                  <span className="text-base font-mono font-bold text-zinc-900">
                    {Math.round((result.probability || 0) * 100)}%
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      result.probability > 0.8
                        ? 'bg-emerald-500'
                        : result.probability > 0.5
                        ? 'bg-amber-500'
                        : 'bg-purple-600'
                    }`}
                    style={{ width: `${Math.round((result.probability || 0) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 text-xs text-zinc-700 font-medium">
                <strong>Analysis:</strong> {result.reason}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
