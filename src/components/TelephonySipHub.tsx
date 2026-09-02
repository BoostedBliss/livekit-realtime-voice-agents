import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, 
  PhoneOff, 
  PhoneForwarded, 
  Hash, 
  Radio, 
  Settings, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  ShieldCheck, 
  Phone
} from 'lucide-react';
import { SipCallSession } from '../types';

interface TelephonySipHubProps {
  onCallStatusChange?: (isActive: boolean) => void;
}

export const TelephonySipHub: React.FC<TelephonySipHubProps> = ({ onCallStatusChange }) => {
  const [activeCall, setActiveCall] = useState<SipCallSession | null>(null);
  const [dialNumber, setDialNumber] = useState('+1 (800) 555-0199');
  const [sipTrunk, setSipTrunk] = useState('Twilio Elastic SIP Trunk');
  const [codec, setCodec] = useState('G.711u (PCMU)');
  const [dtmfLogs, setDtmfLogs] = useState<string[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [agentSpeech, setAgentSpeech] = useState<string>('');

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeCall && activeCall.status === 'connected') {
      onCallStatusChange?.(true);
      timerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      onCallStatusChange?.(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeCall]);

  const handleStartCall = async (direction: 'inbound' | 'outbound') => {
    setActiveCall({
      id: 'sip-' + Math.random().toString(36).substring(2, 8),
      phoneNumber: dialNumber,
      direction,
      status: 'ringing',
      durationSeconds: 0,
      sipTrunk,
      codec,
      dtmfHistory: [],
    });

    setDtmfLogs([]);
    setAgentSpeech('Connecting SIP bridge over LiveKit Telephony gateway...');

    setTimeout(() => {
      setActiveCall((prev) => prev ? { ...prev, status: 'connected' } : null);
      setAgentSpeech(
        direction === 'inbound'
          ? 'Thank you for calling LiveKit Voice Services. Press 1 for Technical Support, 2 for Account Billing, or stay on the line to speak with an AI specialist.'
          : 'Hello! This is your automated voice assistant calling on behalf of LiveKit Enterprise. How can I help you today?'
      );
    }, 1500);
  };

  const handleEndCall = () => {
    setActiveCall(null);
    setAgentSpeech('');
    onCallStatusChange?.(false);
  };

  const handleSendDtmf = (digit: string) => {
    if (!activeCall || activeCall.status !== 'connected') return;

    // Play quick beep tone
    playDtmfTone();
    setDtmfLogs((prev) => [...prev, `DTMF Key '${digit}' received at ${callDuration}s`]);

    if (digit === '1') {
      setAgentSpeech('Routing to Technical Support queue via LiveKit SIP dispatch. One moment please.');
    } else if (digit === '2') {
      setAgentSpeech('Accessing Billing & Account records via Postgres MCP tool.');
    } else {
      setAgentSpeech(`Received digit ${digit}. How else may I route your call?`);
    }
  };

  const playDtmfTone = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(697, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const keypad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PhoneCall className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                LiveKit Telephony & SIP Stack
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                PSTN / SIP Bridge Ready
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Make and receive phone calls directly with LiveKit agents. Supports SIP trunks (Twilio, Telnyx), DTMF keypad detection, and PSTN audio transcoding.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 bg-zinc-100 rounded-lg text-zinc-700 font-mono border border-zinc-200">
              SIP URI: sip:agent@sip.livekit.cloud
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Phone Dialer & Inbound/Outbound Triggers */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-zinc-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Interactive SIP Phone Simulator</span>
              {activeCall && (
                <span className="text-xs font-mono font-bold text-emerald-600 animate-pulse">
                  CALL {activeCall.status.toUpperCase()} ({formatSeconds(callDuration)})
                </span>
              )}
            </h3>

            {/* Dial Number Input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Phone Number (E.164 Format)
              </label>
              <input
                type="text"
                value={dialNumber}
                onChange={(e) => setDialNumber(e.target.value)}
                disabled={!!activeCall}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm font-mono font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            {/* Dialpad Grid */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto mb-6">
              {keypad.flat().map((k) => (
                <button
                  key={k}
                  onClick={() => handleSendDtmf(k)}
                  className="h-12 bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 border border-zinc-200 rounded-xl text-base font-bold text-zinc-800 transition-colors shadow-2xs flex flex-col items-center justify-center cursor-pointer"
                >
                  <span>{k}</span>
                  <span className="text-[9px] text-zinc-400 font-normal -mt-0.5">
                    {k === '1' ? ' ' : k === '2' ? 'ABC' : k === '3' ? 'DEF' : k === '4' ? 'GHI' : k === '5' ? 'JKL' : k === '6' ? 'MNO' : k === '7' ? 'PQRS' : k === '8' ? 'TUV' : k === '9' ? 'WXYZ' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Call Buttons */}
          <div className="pt-4 border-t border-zinc-100 flex items-center gap-3">
            {!activeCall ? (
              <>
                <button
                  onClick={() => handleStartCall('inbound')}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  Simulate Inbound Call
                </button>
                <button
                  onClick={() => handleStartCall('outbound')}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <PhoneForwarded className="w-4 h-4" />
                  Dispatch Outbound Call
                </button>
              </>
            ) : (
              <button
                onClick={handleEndCall}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <PhoneOff className="w-4 h-4" />
                Hang Up Call ({formatSeconds(callDuration)})
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Telephony Channel Status & DTMF Monitor */}
        <div className="lg:col-span-6 space-y-4">
          {/* Active Call Audio Banner */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-600" />
              Live Telephony Audio Channel
            </h3>

            {activeCall ? (
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                  <span>Trunk: {activeCall.sipTrunk}</span>
                  <span className="text-emerald-400 font-semibold">{activeCall.codec}</span>
                </div>

                <div className="text-zinc-300">
                  <span className="text-zinc-500 font-bold block mb-1">Agent Spoken Audio Stream:</span>
                  <p className="bg-zinc-800/80 p-2.5 rounded text-xs text-zinc-200 leading-relaxed italic">
                    "{agentSpeech}"
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-zinc-800 text-zinc-400">
                  <div>Jitter: <strong className="text-zinc-200">3.8 ms</strong></div>
                  <div>Loss: <strong className="text-zinc-200">0.01%</strong></div>
                  <div>RTT: <strong className="text-zinc-200">22 ms</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200 text-xs text-zinc-500">
                No call in progress. Initiate an inbound or outbound call using the dialpad.
              </div>
            )}
          </div>

          {/* DTMF Keypad Tones Log */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4 text-purple-600" />
              DTMF Signal & Keypress Log
            </h3>
            <p className="text-xs text-zinc-500 mb-3">
              Captures RFC 2833 / SIP INFO tones during calls for interactive phone navigation.
            </p>

            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 min-h-[140px] max-h-[160px] overflow-y-auto space-y-1 font-mono text-xs">
              {dtmfLogs.length === 0 ? (
                <span className="text-zinc-400 italic">Waiting for DTMF tones (click keypad keys above)...</span>
              ) : (
                dtmfLogs.map((log, i) => (
                  <div key={i} className="text-zinc-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
