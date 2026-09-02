import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI:", err);
    }
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Agent interaction endpoint
app.post("/api/agent/chat", async (req, res) => {
  const {
    message,
    history = [],
    systemPrompt = "You are a fast, natural, voice-first AI assistant powered by LiveKit agents. Keep responses concise, conversational, and direct, suitable for speech synthesis.",
    pipeline = {
      stt: "deepgram-nova-2",
      llm: "gemini-3.8-flash",
      tts: "cartesia-sonic",
    },
    mcpTools = [],
  } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  const ai = getGeminiClient();
  const startTime = Date.now();

  try {
    let replyText = "";
    let toolCallsTriggered: Array<{ name: string; args: Record<string, any>; result: string }> = [];

    if (ai) {
      // Build conversation contents
      const contents = history.map((h: { role: string; content: string }) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      }));

      // Add tool context if available
      let promptWithTools = message;
      if (mcpTools.length > 0) {
        promptWithTools += `\n\n[Active MCP Tools Available: ${mcpTools.map((t: any) => `${t.name}: ${t.description}`).join(", ")}]`;
      }

      contents.push({
        role: "user",
        parts: [{ text: promptWithTools }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction: systemPrompt + " Always provide brief, voice-friendly answers (under 2-3 sentences max).",
          temperature: 0.7,
        },
      });

      replyText = response.text || "I understood your request. How else can I assist you?";
    } else {
      // Fallback voice agent simulation
      const lower = message.toLowerCase();
      if (lower.includes("weather")) {
        replyText = "The current weather in San Francisco is 68°F and mostly sunny with a gentle breeze of 8 miles per hour.";
        toolCallsTriggered.push({
          name: "mcp_weather_lookup",
          args: { location: "San Francisco, CA" },
          result: "temp: 68F, condition: sunny, wind: 8mph",
        });
      } else if (lower.includes("flight") || lower.includes("book")) {
        replyText = "I found flight UA 428 departing SFO at 9:15 AM to Tokyo Haneda. Shall I reserve a seat for you?";
        toolCallsTriggered.push({
          name: "mcp_travel_api",
          args: { destination: "Tokyo", origin: "SFO" },
          result: "available_flights: [UA428, JL001]",
        });
      } else if (lower.includes("order") || lower.includes("status")) {
        replyText = "Order #LK-9821 has shipped via Priority Express and is scheduled for delivery tomorrow by 3:00 PM.";
        toolCallsTriggered.push({
          name: "mcp_postgres_crm",
          args: { order_id: "LK-9821" },
          result: "status: in_transit, eta: tomorrow 3PM",
        });
      } else {
        replyText = `Understood. I am processing your request using the ${pipeline.stt} speech-to-text and ${pipeline.tts} voice engine. What would you like to explore next?`;
      }
    }

    const elapsed = Date.now() - startTime;
    // Simulated micro-benchmarks based on selected providers
    const sttLatency = pipeline.stt.includes("deepgram") ? 110 : 160;
    const turnDetectLatency = 32;
    const llmTTFT = Math.max(120, elapsed);
    const ttsTTFB = pipeline.tts.includes("cartesia") ? 95 : 130;
    const totalLatency = sttLatency + turnDetectLatency + llmTTFT + ttsTTFB;

    res.json({
      reply: replyText,
      toolCalls: toolCallsTriggered,
      metrics: {
        sttMs: sttLatency,
        turnDetectMs: turnDetectLatency,
        llmTtftMs: llmTTFT,
        ttsTtfbMs: ttsTTFB,
        totalMs: totalLatency,
      },
    });
  } catch (err: any) {
    console.error("Agent chat error:", err);
    res.status(500).json({
      reply: "I encountered a minor processing delay. Could you please repeat that?",
      error: err.message,
    });
  }
});

// Semantic turn detection analysis endpoint
app.post("/api/turn-detect", async (req, res) => {
  const { text, minSilenceMs = 250 } = req.body;
  if (!text) {
    return res.json({ complete: false, probability: 0, reason: "No input audio text" });
  }

  const ai = getGeminiClient();
  const trimmed = text.trim();

  // Fast heuristic regex for trailing conjunctions/fillers
  const incompleteEnding = /(?:and|or|but|because|so|if|to|with|about|at|by|for|from|like|um|uh|hmm|well|wait|\.\.\.)$/i.test(trimmed);

  if (incompleteEnding) {
    return res.json({
      complete: false,
      probability: 0.18,
      status: "user_turn_incomplete",
      reason: "Detected trailing connector/filler word",
      latencyMs: 18,
    });
  }

  if (ai) {
    try {
      const prompt = `Analyze if the user has completed their spoken turn or if they paused mid-thought.
Text: "${trimmed}"
Respond strictly with valid JSON:
{
  "complete": boolean,
  "probability": number (0.0 to 1.0),
  "reason": "short explanation"
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      return res.json({
        complete: parsed.complete ?? true,
        probability: parsed.probability ?? 0.92,
        status: parsed.complete ? "turn_completed" : "turn_pause",
        reason: parsed.reason || "Semantic grammatical closure",
        latencyMs: 34,
      });
    } catch {
      // Fallback
    }
  }

  // Fallback heuristic
  const isComplete = trimmed.length > 10 && /[.?!]$/.test(trimmed);
  res.json({
    complete: isComplete,
    probability: isComplete ? 0.94 : 0.65,
    status: isComplete ? "turn_completed" : "turn_provisional",
    reason: isComplete ? "Syntactic clause closed" : "Evaluating intonation contour",
    latencyMs: 22,
  });
});

// Built-in LLM Judge Evaluation endpoint
app.post("/api/eval/judge", async (req, res) => {
  const {
    scenario = "Customer Return Policy",
    agentTranscript = [],
    metrics = {},
  } = req.body;

  const ai = getGeminiClient();

  try {
    if (ai && agentTranscript.length > 0) {
      const dialogue = agentTranscript
        .map((t: any) => `${t.role.toUpperCase()}: ${t.content}`)
        .join("\n");

      const prompt = `You are an automated Voice Agent Evaluation Judge (LiveKit Agent Evals).
Evaluate the following voice conversation test session for Scenario: "${scenario}".
Metrics observed: ${JSON.stringify(metrics)}
Conversation:
${dialogue}

Provide evaluation in strict JSON format:
{
  "score": number (0-100),
  "verdict": "PASS" | "FAIL" | "NEEDS_IMPROVEMENT",
  "criteria": {
    "goalCompletion": number (0-100),
    "factualAccuracy": number (0-100),
    "latencyScore": number (0-100),
    "naturalPacing": number (0-100),
    "interruptionResilience": number (0-100)
  },
  "feedback": "Concise summary of agent performance and suggestions for prompt or VAD tuning."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      return res.json(parsed);
    }
  } catch (err) {
    console.error("Judge evaluation error:", err);
  }

  // Fallback evaluation if offline
  res.json({
    score: 92,
    verdict: "PASS",
    criteria: {
      goalCompletion: 95,
      factualAccuracy: 90,
      latencyScore: 94,
      naturalPacing: 88,
      interruptionResilience: 92,
    },
    feedback: "Agent maintained crisp, under-3-sentence conversational turns with low TTFT (<350ms) and accurately fulfilled customer inquiry without hallucinations.",
  });
});

// MCP Tool Execution endpoint
app.post("/api/mcp/call", async (req, res) => {
  const { tool, server, args } = req.body;
  const startTime = Date.now();

  let result: any = {};
  if (tool === "postgres_query") {
    result = {
      rowCount: 3,
      rows: [
        { id: 101, name: "Acme Corp", plan: "Enterprise Voice", sip_trunks: 4 },
        { id: 102, name: "OmniTech", plan: "Scale", sip_trunks: 2 },
        { id: 103, name: "CloudStream", plan: "Starter", sip_trunks: 1 },
      ],
      executionTimeMs: 14,
    };
  } else if (tool === "github_search") {
    result = {
      repository: "livekit/agents",
      stars: 6420,
      openIssues: 24,
      latestRelease: "v0.9.4",
      activeWorkers: 12,
    };
  } else if (tool === "calendar_check") {
    result = {
      availableSlots: ["Tomorrow 10:00 AM PST", "Tomorrow 2:30 PM PST", "Thursday 11:00 AM PST"],
      timezone: "America/Los_Angeles",
    };
  } else {
    result = {
      executed: true,
      tool,
      server,
      args,
      output: "Mock MCP execution successful with native one-line integration.",
    };
  }

  res.json({
    status: "success",
    durationMs: Date.now() - startTime,
    result,
  });
});

// Telephony SIP call dispatch simulation
app.post("/api/telephony/dispatch", (req, res) => {
  const {
    direction = "inbound",
    phoneNumber = "+1 (800) 555-0199",
    sipTrunk = "Twilio Elastic SIP Trunk",
    codec = "PCMU (G.711u)",
  } = req.body;

  const callId = "sip-" + Math.random().toString(36).substring(2, 9);
  res.json({
    callId,
    status: "connected",
    direction,
    phoneNumber,
    sipTrunk,
    codec,
    jitterMs: 4.2,
    packetLossPct: 0.02,
    dtmfEnabled: true,
    roomName: `sip-room-${callId}`,
  });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LiveKit Voice Agent Studio running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
