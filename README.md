# HDV Agent Core v0.1.1

Strict hierarchical multi-agent system with **forced one-way memory**.

```
DREAM  →  VISION  →  HOPE
                ↑
              APEX
KNOLL = silent observer (reads all, writes nothing to agents or user)
```

Every agent carries the full system knowledge (Soul Thesis, Branching Decision Fingerprint, reality layers, haptic coherence rules, one-way memory law).

## Quick Start (test tonight)

```bash
git clone https://github.com/joeholloway445-maker/hdv-agent-core.git
cd hdv-agent-core
npm install
cp .env.example .env
npm run dev
```

You should see the full hierarchy run one cycle and print the memory HOPE can see.

## Agent Rotation (the full order)

1. **DREAM** – Generates the immediate user-facing experience / companion response / emotion. Pushes upward only.
2. **VISION** – Reads DREAM, synthesizes operational intent, prepares haptic/world recommendations. Pushes upward only.
3. **HOPE** – Absolute authority. Reads everything that came up, issues paradigm-level directives. Never pushes down.
4. **APEX** – Executes side-effects (haptics, world updates). Reports status upward only.
5. **KNOLL** – Silent security monitor. Reads everything. Writes nothing to agents or user.

This order is fixed. The MemoryBus will throw if anything tries to go the wrong direction.

## Godot Path

Keep this Node process as the brain. Godot is the body.
Godot sends user action + layer → Core runs the rotation → returns companion line + emotion + haptic command.

## What’s left

- Real LingBot / world-model endpoint
- Real haptic provider API calls
- Godot ↔ Core bridge
- Session / long-term memory
- Actual Branching Decision Fingerprint scorer
