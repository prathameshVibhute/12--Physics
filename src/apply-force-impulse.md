# Cannon.js Force & Impulse Methods — Complete Guide

Cannon.js gives you four ways to push a physics body. They differ along two independent axes:

1. **Force vs Impulse** — how long the push lasts
2. **World vs Local** — which direction system the push uses

---

## 1. applyForce

**What it is:** A continuous push, applied in world (fixed) coordinates.

**Real world example:** Pushing a shopping cart across a parking lot. You keep pushing with your hands, step after step, in a fixed direction (say, "north"). It doesn't matter which way the cart itself is facing — you're pushing toward a fixed compass direction.

**Key facts:**
- Must be called **every frame** in your update loop, or the effect is negligible.
- Direction is fixed relative to the world, not the object.
- Good for: continuous wind, thrust, conveyor belts, constant pushing.

**Code:**
```js
function update() {
  // Push north, every frame, as long as this keeps being called
  body.applyForce(new CANNON.Vec3(0, 0, -50), body.position);
}
```

---

## 2. applyImpulse

**What it is:** An instant, one-time push, applied in world (fixed) coordinates.

**Real world example:** Someone gives your shopping cart a single hard shove and lets go. That one shove instantly changes its speed. You don't touch it again — it just rolls on its own afterward.

**Key facts:**
- Called **once**, at the exact moment the event happens.
- Directly changes velocity instantly (no build-up like force).
- Direction is fixed relative to the world, not the object.
- Good for: jumps, explosions, bullet impacts, one-time kicks.

**Code:**
```js
function onJumpPressed() {
  // One quick shove upward, doesn't repeat
  body.applyImpulse(new CANNON.Vec3(0, 5, 0), body.position);
}
```

**Important:** After an impulse, the object keeps moving at that velocity **forever** unless something else acts on it — gravity, damping, friction, or a collision. On its own, nothing slows it down (Newton's first law).

---

## 3. applyLocalForce

**What it is:** A continuous push, applied in local (object's own) coordinates.

**Real world example:** A car's engine accelerating. The engine always pushes the car "forward" — meaning whatever direction the car's front bumper currently faces, even after the car turns a corner. You don't recalculate "forward" yourself; the car handles that automatically based on its own orientation.

**Key facts:**
- Must be called **every frame**, just like `applyForce`.
- Direction rotates along with the object's current orientation.
- Good for: engine thrust, rockets, anything that should push relative to the object's own facing direction.

**Code:**
```js
function update() {
  // Push forward relative to the object's own orientation, every frame
  body.applyLocalForce(new CANNON.Vec3(0, 0, 100), new CANNON.Vec3(0, 0, 0));
}
```

---

## 4. applyLocalImpulse

**What it is:** An instant, one-time push, applied in local (object's own) coordinates.

**Real world example:** A gun's recoil when fired. The recoil always kicks "backward" relative to the gun's own barrel direction — not a fixed compass direction. If you're aiming up, down, or sideways, the recoil still pushes back along the gun's own axis.

**Key facts:**
- Called **once**, at the exact moment of the event.
- Direction rotates along with the object's current orientation.
- Good for: recoil, local explosions, kicks relative to the object's own facing direction.

**Code:**
```js
function onFireWeapon() {
  // One-time recoil kick, relative to the gun's own orientation
  body.applyLocalImpulse(new CANNON.Vec3(0, 0, -10), new CANNON.Vec3(0, 0, 0));
}
```

---

## World vs Local — Quick Recap

- **World** = fixed direction from an outside observer's point of view. "North" stays north no matter how the object rotates.
- **Local** = direction from the object's own point of view. "Forward" always means whatever way the object is currently facing — it rotates along with the object.

---

## Force vs Impulse — Quick Recap

- **Force** = continuous push. Must be called every frame (like holding a button down). Builds up speed gradually.
- **Impulse** = instant push. Called once (like tapping a button). Changes velocity immediately.
- An impulse-driven object keeps moving forever unless gravity, damping, friction, or collisions act on it.

---

## Summary Table

| Method              | Duration      | Direction space | Real world analogy         |
|---------------------|---------------|------------------|-----------------------------|
| `applyForce`        | Continuous    | World            | Pushing a cart across a lot  |
| `applyImpulse`      | Instant       | World            | Someone bumps the cart once  |
| `applyLocalForce`   | Continuous    | Local (object)   | Car engine accelerating      |
| `applyLocalImpulse` | Instant       | Local (object)   | Gun recoil when firing       |

---

## Common Mistakes to Avoid

1. **Using `applyForce` once, expecting a strong push** — it'll barely do anything since force needs sustained calls to build up speed.
2. **Using `applyImpulse` inside a per-frame loop** — this gives a full instant kick every frame, causing the object to fly off far too fast.
3. **Forgetting damping/gravity/friction** — if you expect an impulse-driven object to naturally slow down and it isn't, check your `linearDamping`, `angularDamping`, gravity settings, and friction values.

```js
body.linearDamping = 0.1;  // 0 = never slows down on its own; higher = slows down faster
body.angularDamping = 0.1; // same idea, but for spinning
```