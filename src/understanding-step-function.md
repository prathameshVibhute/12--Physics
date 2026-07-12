// https://gafferongames.com/post/fix_your_timestep/
#Cannon js
// http://schteppe.github.io/cannon.js/docs/

# Understanding `world.step()` in Cannon.js / Cannon-es

## The Line

```typescript
world.step(1/60, deltaTime, 3);
```

## Signature

```ts
world.step(fixedTimeStep, timeSinceLastCalled, maxSubSteps)
```

---

## 1. What is a "step"?

A **step** = one single update of the physics world. Each step:
- Moves objects a tiny bit (based on velocity/forces)
- Checks for collisions
- Resolves overlaps / applies constraints

One `step()` call can internally run **multiple** of these small updates — that's what `maxSubSteps` controls.

---

## 2. `fixedTimeStep` (1st param) — `1/60`

- This is the **size** of one physics update slice, not a timing rule.
- It does **not** mean "call this function every 16ms." You can call `step()` whenever your loop runs.
- Physics engines are more **stable and deterministic** when they always integrate using the same fixed chunk size, instead of random variable amounts.
- Analogy: like a ruler where the smallest unit is 1cm — it defines the *measurement size*, not *when* you use the ruler.

---

## 2.5 Common Misunderstanding — "Must I call step() every 16ms?"

**Wrong assumption:** *"`1/60` means the function must be called within 16ms — not before, not after."*

**Correction:** No — `1/60` is **not a timing rule** for when you call `step()`. You can call `step()` whenever your loop runs (every frame, late, early — doesn't matter). It only defines the **size** of one physics slice, not the schedule.

### Example to make it click

Say you call `world.step()` inside your render loop, and frames are irregular:

- Frame 1: called after **10ms** passed
- Frame 2: called after **40ms** passed
- Frame 3: called after **15ms** passed

Cannon doesn't care that you called it "late" or "early." Each time you call it, it just looks at how much real time passed (`deltaTime`) and calculates how many `1/60` (16ms) slices fit into that:

| Real time passed | What Cannon does |
|---|---|
| 10ms | Not even a full slice yet → 0 steps, time accumulates for next call |
| 40ms | ~2.5 slices → runs **2 steps** (rounds down, leftover accumulates) |
| 15ms | ~1 slice → runs **1 step** |

### One-line correction

❌ "The code should be called within 16ms, not before, not after."

✅ **"Physics always moves forward in 16ms-sized pieces internally — no matter when or how often you actually call the function."**

You call `step()` whenever your animation loop runs (e.g. once per rendered frame, however fast/slow that is). Cannon then internally breaks up the real elapsed time into 16ms pieces to stay accurate.

---

## 3. `timeSinceLastCalled` (2nd param) — `deltaTime`

- The **real elapsed time** since the last `step()` call (e.g. `currentTime - lastTime`).
- Frame rates are irregular — some frames take 10ms, some 30ms, some 100ms (lag).
- Cannon uses `deltaTime` to calculate **how many fixed-size (`1/60`) steps** are needed to "catch up" to real time.

### Example
| deltaTime | Steps needed |
|---|---|
| 16ms | 1 |
| 33ms | 2 |
| 50ms | 3 |
| less than 16ms | 0 (time accumulates for next call) |

---

## 4. `maxSubSteps` (3rd param) — `3`

- A **safety cap** on how many internal steps can run in a single `step()` call.
- Prevents the **"spiral of death"**: if a big lag spike causes `deltaTime` to jump (e.g. 500ms), without a cap Cannon would try to run ~30 steps at once — which itself takes real time, causing the next frame to lag more, causing more steps needed, etc. — freezing the app permanently.
- With the cap, if more steps are "needed" than the max, Cannon just **runs slow-motion briefly** instead of crashing/freezing.

### Example
| deltaTime | Steps needed | Steps actually run (`maxSubSteps=3`) |
|---|---|---|
| 16ms | 1 | 1 |
| 48ms | 3 | 3 |
| 60ms | ~4 | **3** (capped) |
| 500ms (freeze) | ~30 | **3** (capped) |

The leftover un-simulated time isn't lost — it stays in the accumulator / gets handled on the next call, so the sim falls slightly behind rather than exploding in computation.

---

## 5. Putting It All Together

```ts
world.step(1/60, deltaTime, 3)
```

> "Update physics in fixed 16ms-sized chunks. Use `deltaTime` (real time since last call) to figure out how many chunks are needed to catch up. But never run more than 3 chunks in one call — to avoid freezing the app during lag spikes."

---

## 6. Why not just `world.step(deltaTime)`?

- You *can* call it with a single argument — but then Cannon uses the raw variable `deltaTime` as the step size directly.
- This is simpler, but **less stable**: irregular/large deltas can cause jitter, tunneling (fast objects passing through colliders), or an unstable constraint solver.
- The 3-argument fixed-timestep + accumulator pattern is the recommended, production-safe approach (based on the well-known "Fixing Your Timestep" pattern).

---

## Quick Reference Table

| Parameter | Value in example | Meaning |
|---|---|---|
| `fixedTimeStep` | `1/60` | Size of one physics slice (~16.67ms) — stability, not timing |
| `timeSinceLastCalled` | `deltaTime` | Real time since last call — used to calculate how many steps to run |
| `maxSubSteps` | `3` | Max steps allowed per call — prevents freeze/spiral-of-death on lag |
