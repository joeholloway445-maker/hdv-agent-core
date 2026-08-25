import "dotenv/config";
import { WebSocketServer, WebSocket } from "ws";
import { MemoryBus } from "./memory/MemoryBus";
import { HopeAgent } from "./agents/Hope";
import { VisionAgent } from "./agents/Vision";
import { DreamAgent } from "./agents/Dream";
import { KnollAgent } from "./agents/Knoll";
import { ApexAgent } from "./agents/Apex";
import { HapticClient } from "./haptic/HapticClient";
import { WorldModel } from "./world/WorldModel";

// ── Types ────────────────────────────────────────────────────────────────────

interface InboundMessage {
  type: "cycle" | "memory_read" | "ping";
  requestId?: string;
  payload?: Record<string, unknown>;
}

interface OutboundMessage {
  type: "cycle_result" | "memory_snapshot" | "pong" | "error";
  requestId?: string;
  data?: unknown;
  error?: string;
}

// ── Shared singletons ────────────────────────────────────────────────────────

const bus = new MemoryBus(process.env.MEMORY_PERSIST_PATH);
const hope = new HopeAgent(bus);
const vision = new VisionAgent(bus);
const dream = new DreamAgent(bus);
const knoll = new KnollAgent(bus);
const apex = new ApexAgent(bus);
const haptic = new HapticClient();
const world = new WorldModel();

// ── Agent cycle ───────────────────────────────────────────────────────────────

async function runCycle(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sceneDescription = String(payload.scene ?? "A door stands open at the end of the corridor.");
  const userAction = (payload.userAction ?? {}) as Record<string, unknown>;

  const worldState = await world.generate(sceneDescription);

  const [dreamMsg, visionMsg, hopeMsg] = await Promise.all([
    dream.process({ world: worldState, userAction }),
    vision.process({}),
    hope.process({}),
  ]);
  await knoll.process({});

  const hapticCmd = payload.haptic as { intensity?: number; pattern?: string; durationMs?: number } | undefined;
  let hapticResult: { ok: boolean; message: string } = { ok: false, message: "no command" };
  if (hapticCmd && typeof hapticCmd.intensity === "number") {
    const apexMsg = await apex.process({ haptic: hapticCmd });
    hapticResult = await haptic.send({
      intensity: hapticCmd.intensity,
      pattern: hapticCmd.pattern,
      durationMs: hapticCmd.durationMs,
    });
    return { dream: dreamMsg, vision: visionMsg, hope: hopeMsg, apex: apexMsg, haptic: hapticResult, world: worldState };
  }

  return { dream: dreamMsg, vision: visionMsg, hope: hopeMsg, haptic: hapticResult, world: worldState };
}

// ── WebSocket server ──────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 4200);
const wss = new WebSocketServer({ port: PORT });

function send(ws: WebSocket, msg: OutboundMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

wss.on("connection", (ws) => {
  console.log("[HDV] Client connected");

  ws.on("message", async (raw) => {
    let msg: InboundMessage;
    try {
      msg = JSON.parse(raw.toString()) as InboundMessage;
    } catch {
      send(ws, { type: "error", error: "Invalid JSON" });
      return;
    }

    const { type, requestId, payload = {} } = msg;

    switch (type) {
      case "ping":
        send(ws, { type: "pong", requestId });
        break;

      case "memory_read": {
        const agent = String(payload.agent ?? "HOPE") as Parameters<MemoryBus["read"]>[0];
        const limit = Number(payload.limit ?? 20);
        const records = bus.read(agent, limit);
        send(ws, { type: "memory_snapshot", requestId, data: records });
        break;
      }

      case "cycle": {
        try {
          const result = await runCycle(payload);
          send(ws, { type: "cycle_result", requestId, data: result });
        } catch (err) {
          send(ws, { type: "error", requestId, error: String(err) });
        }
        break;
      }

      default:
        send(ws, { type: "error", requestId, error: `Unknown message type: ${type}` });
    }
  });

  ws.on("close", () => console.log("[HDV] Client disconnected"));
  ws.on("error", (err) => console.warn("[HDV] WS error:", err.message));
});

console.log(`[HDV] Agent Core WebSocket server listening on ws://0.0.0.0:${PORT}`);
console.log("[HDV] Agents: HOPE / VISION / DREAM / KNOLL / APEX");
console.log("[HDV] Send { type: 'cycle', payload: { scene, userAction, haptic? } } to run a cycle");
