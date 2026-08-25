import { AgentId, AgentMessage, HapticCommand } from "../core/types";
import { BaseAgent } from "./BaseAgent";

export class ApexAgent extends BaseAgent {
  readonly id: AgentId = "APEX";

  async process(input: Record<string, unknown>): Promise<AgentMessage | null> {
    const hapticCmd = input.haptic as HapticCommand | undefined;

    const report = {
      type: "apex_execution_report",
      hapticDispatched: hapticCmd ? this.dispatchHaptic(hapticCmd) : null,
      timestamp: Date.now(),
    };

    const record = this.remember(report, ["apex", "execution"]);
    return {
      id: record.id,
      from: this.id,
      content: report,
      timestamp: record.timestamp,
    };
  }

  private dispatchHaptic(cmd: HapticCommand): Record<string, unknown> {
    // Dry-run: log the command; real implementation would call hardware SDK
    console.log(`[APEX] Haptic dispatch → pattern=${cmd.pattern} intensity=${cmd.intensity} duration=${cmd.durationMs}ms`);
    return { dispatched: true, pattern: cmd.pattern, intensity: cmd.intensity, durationMs: cmd.durationMs };
  }
}
