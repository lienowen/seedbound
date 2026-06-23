# Pocket Planet Next Sprint

Generated: 2026-06-21T04:30:10.806Z
Current phase: **core**
Phase gate: Five external testers complete the forest detail loop without explanation; at least three immediately retry or inspect another region.
Build status: **FAIL** - ENOENT: no such file or directory, stat 'D:\develop\me\seedbound\src\App.jsx'

## Product Rule

Do not begin retention, growth, or monetization work until the current phase gate is measured and passed.

## Selected Work

### 1. Build the forest zoom-in exploration scene

- ID: `forest-detail`
- Owner: product-engineering
- Impact / effort: 10 / 7
- Acceptance:
  - Clicking the forest smoothly enters a detailed paper-cut scene
  - Watering reveals plant growth and a hidden bird nest
  - Returning to the valley preserves the changed forest state

### 2. Add curiosity signals to five valley regions

- ID: `curiosity-hotspots`
- Owner: game-design
- Impact / effort: 9 / 4
- Acceptance:
  - Forest, mountain, river, volcano, and field each have a subtle motion cue
  - Hotspots are discoverable without tutorial text
  - Each hotspot has a unique detail-scene promise

### 3. Upgrade rain, growth, fire, ice, and wind feedback

- ID: `reaction-feedback`
- Owner: game-feel
- Impact / effort: 9 / 5
- Acceptance:
  - Every action produces visible feedback within 150 ms
  - Successful chains have a clear anticipation, impact, and settle phase
  - Reduced-motion users receive a readable alternative

## Validation Metrics

- First meaningful interaction within 10 seconds.
- Detail-scene open rate above 45%.
- Detail-scene completion above 60%.
- Immediate retry or second-region exploration above 35%.
- No paid acquisition until at least five external playtests are recorded.

## Commands

```powershell
npm run autopilot
npm run autopilot:status
npm run autopilot:complete -- forest-detail
```
