# Velocity Rift 3.8.2 — Fenda Original / APK R16

The official traversal replaces the 10,000-unit experimental section with a
36,600-unit world (finish trigger at 36,000), longer than all three earlier
worlds. Final combat, the rescue, transformation, credits, and final campaign
completion remain reserved for 4.0.

## Playable content

- Nine sectors, nine checkpoints, five linked rifts preserving forward momentum.
- Two extended inverted-gravity sections; five visible automatic dimensional
  anchors. Jump and horizontal Dash retain their existing commands on mobile.
- Three extended slope sequences, destructible barriers, a final 520-unit gap
  and a membrane requiring an active aerial Dash.
- Four enemy types (shard, sentinel, wraith, crusher). Boost and Dash defeat them;
  spikes, sentinel shots and timed lasers remain dangerous during attacks.
- Nine-core entrance altar and return rift. Test 100% and DEBUG remain separate;
  Test 100% grants access/capacity without invulnerability or counterfeit saves.
- Crystals absorb ordinary damage using the existing minimum-8 / 35% rule.
  Pits lose all crystals and open the minimalist death menu. Respawn restores
  checkpoint gravity/dimension and reconstitutes upcoming resource pickups.
- Boost energy refills only from Boost orbs. No automatic recharge from crystals,
  barriers or checkpoints; recovery orbs sit next to all checkpoint spawns.
- Four brief Soberano apparitions and sector variations of A Origem do Vazio.
- Original Flux sprite and existing touch controls, sparse HUD, seven-color
  speedometer, pause/menu/restart and traversal result screen.
- Results are session-only; the unfinished finale does not grant a stage clear,
  achievements, permanent cores/secrets, a ghost or campaign completion.

## Automated verification

`npm run check` runs unit tests, production build, original browser regression
checks and the new complete traversal in Chromium desktop and Android landscape.
The route driver uses movement inputs only: no state injection, teleport cheats,
DEBUG or invulnerability. It reaches all sectors/checkpoints, five portals and
five anchors, destroys the membrane with Dash and completes with no deaths.
Additional checks cover fatal falls, inverted checkpoint recovery, recovery
orbs, gated access, resource refill rules and laser warnings.

Screenshots cover entrance, ceiling, Echo, momentum, moving islands, inverted
cathedral, final threshold, results, pause and death on both browser sizes.
The development-only QA API is removed by Vite from the production bundle.
The existing campaign save is compared byte-for-byte before/after the traversal.

## Remaining manual device checks

- Play the complete stage using keyboard and real Android touch controls.
- Check timed hazards, difficulty, sound variations and sustained device FPS.
- Install APK R16 and verify the visible 3.8.2 marker; inspect all menus on the
  device's actual safe areas and verify prior campaign progress remains readable.
- Collect the nine legitimate cores to test the gate; use Test 100% for a faster
  isolated gameplay check, and disable it before testing ordinary progression.
