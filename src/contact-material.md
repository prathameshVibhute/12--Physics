# Cannon.js: ContactMaterial, Materials, and defaultContactMaterial

In Cannon.js (and its maintained fork cannon-es), materials work at two levels:
individual materials for bodies, and contact materials that define how pairs
of materials interact.

## CANNON.Material

Represents a physical material type — think "wood," "ice," "rubber." It's
essentially just a labeled reference, not a bundle of physical properties
itself.

```javascript
const groundMaterial = new CANNON.Material('ground');
const wheelMaterial = new CANNON.Material('wheel');
```

Assign a material to a body:

```javascript
const groundBody = new CANNON.Body({
  mass: 0,
  material: groundMaterial
});
```

You can create as many materials as you want — one per surface type you care
about (ice, rubber, metal, wood, etc.). The material itself has no
friction/bounciness values; those are defined separately via `ContactMaterial`.

## CANNON.ContactMaterial

Defines what happens when two specific materials touch each other. It takes
two `Material` instances plus an options object:

```javascript
const groundWheelContact = new CANNON.ContactMaterial(
  groundMaterial,
  wheelMaterial,
  {
    friction: 0.3,
    restitution: 0.2,
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 3,
    frictionEquationStiffness: 1e8,
    frictionEquationRelaxation: 3
  }
);

world.addContactMaterial(groundWheelContact);
```

### Key properties

- **friction** – how much resistance there is to sliding between the two surfaces.
- **restitution** – bounciness (0 = no bounce, 1 = perfectly elastic).
- **contactEquationStiffness / contactEquationRelaxation** – controls how "hard" or "soft" the collision response is (numerical stiffness of the solver, not physical stiffness).
- **frictionEquationStiffness / frictionEquationRelaxation** – same idea, but for the friction constraint solving.

You'd typically create one `ContactMaterial` for every pair of materials whose
interaction matters (ice-vs-wheel, ground-vs-wheel, etc.). If you have N
materials and care about all pairwise interactions, that's potentially
N(N+1)/2 contact materials — though in practice you only bother defining the
ones that actually need custom behavior.

## world.defaultContactMaterial

If two colliding bodies use materials that don't have an explicit
`ContactMaterial` registered for that pair, Cannon falls back to
`world.defaultContactMaterial`. It's essentially the "catch-all" contact
behavior.

```javascript
const world = new CANNON.World();

// Tweak default friction/restitution for any unmatched material pair
world.defaultContactMaterial.friction = 0.3;
world.defaultContactMaterial.restitution = 0.1;
```

You can also replace it entirely with your own `ContactMaterial`:

```javascript
const defaultMaterial = new CANNON.Material('default');
const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1,
    restitution: 0.7
  }
);

world.defaultContactMaterial = defaultContactMaterial;
world.addContactMaterial(defaultContactMaterial);
```

A common pattern is to assign every body the same `defaultMaterial` unless it
needs special behavior, so you can just rely on tweaking
`world.defaultContactMaterial` globally rather than creating a contact
material for every pair.

## Quick summary

| Concept | Purpose |
|---|---|
| `CANNON.Material` | A named label attached to a body (e.g. "ice", "rubber") |
| `CANNON.ContactMaterial` | Defines friction/restitution/stiffness when two specific materials collide |
| `world.defaultContactMaterial` | Fallback behavior used when no specific `ContactMaterial` exists for a colliding pair |