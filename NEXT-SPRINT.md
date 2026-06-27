# Seedbound Next Sprint

Generated: 2026-06-27T00:00:00.000Z
Current phase: **submission**
Phase gate: CrazyGames-ready browser build with stable English-first UX, clean first-session flow, and no blocker-level placement bugs in the first 10 levels.
Build status: **PENDING**

## Product Rule

Every change must improve one of these three things first:

- First 10 seconds clarity
- Drag-and-drop satisfaction
- Portal submission safety

Do not add heavy meta systems before the core fridge loop feels clean and watchable.

## Selected Work

### 1. Placement feel pass

- ID: `placement-feel-pass`
- Owner: game-feel
- Impact / effort: 10 / 6
- Acceptance:
  - Correct placements feel magnetic and readable
  - Invalid drops communicate clearly without confusion
  - Door racks, shelves, and drawer placements feel visually seated

### 2. Coin sink through hints

- ID: `coin-sink-hint`
- Owner: systems
- Impact / effort: 9 / 4
- Acceptance:
  - Players can spend coins during a run
  - Hints reveal a valid next placement without auto-solving the level
  - Coins persist correctly after spending and winning

### 3. Repository identity cleanup

- ID: `repo-identity-cleanup`
- Owner: ops
- Impact / effort: 8 / 2
- Acceptance:
  - package metadata uses the Seedbound name
  - Sprint/autopilot files refer to the fridge game
  - Build freshness checks look at active Seedbound source files

## Validation Metrics

- First correct placement in level 1 within 10 seconds for a new player
- No white-screen or route break when embedded in a portal iframe
- `npm run build` passes
- `npm run validate:fridge` passes
- At least one meaningful coin spend available during gameplay

## Commands

```powershell
npm run build
npm run validate:fridge
npm run autopilot
npm run autopilot:status
npm run autopilot:complete -- coin-sink-hint
```
