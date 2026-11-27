// Turkey Run world: the simulation, no DOM, no drawing. One clear job: step
// the turkey, the farmer, the obstacles and the pickups forward, and report
// what happened (score, hits, caught, escaped) as event flags.
// The runner is a side-scroller: the turkey holds its x, the world scrolls.
import { FIELD, GROUND_Y, PX_PER_METRE, TURKEY, RUN, STAGES, OBSTACLES, PICKUPS, STEP } from './config.js';
import { mulberry32, weightedPick, randInt, randFloat } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1 << 0;
export const EVENT_PICKUP = 1 << 1;
export const EVENT_CAUGHT = 1 << 2;
export const EVENT_ESCAPED = 1 << 3;
export const EVENT_JUMP = 1 << 4;
export const EVENT_DOUBLE_JUMP = 1 << 5;
export const EVENT_STAGE = 1 << 6;
export const EVENT_HEART = 1 << 7;

export const KIND_FENCE = 'fence';
export const KIND_HAYBALE = 'haybale';
export const KIND_PUMPKIN = 'pumpkin';
export const KIND_KNIFE = 'knife';
export const KIND_OVEN = 'oven';
export const KIND_NET = 'net';
export const KIND_DOG = 'dog';
export const KIND_CORN = 'corn';
export const KIND_FEATHER = 'feather';
export const KIND_PIE = 'pie';

/** Which stage index the turkey is in at `metres`. */
export function stageIndexAt(metres) {
  for (let i = 0; i < STAGES.length; i += 1) {
    if (metres < STAGES[i].until) return i;
  }
  return STAGES.length - 1;
}

function speedAt(metres) {
  return Math.min(RUN.maxSpeed, RUN.startSpeed + metres * RUN.speedPerMetre);
}

function obstacleTable(stage) {
  const table = [
    { value: KIND_FENCE, weight: 30 },
    { value: KIND_HAYBALE, weight: 24 },
    { value: KIND_PUMPKIN, weight: 18 },
    { value: KIND_NET, weight: 12 },
  ];
  if (stage >= 1) table.push({ value: KIND_KNIFE, weight: 20 });
  if (stage >= 1) table.push({ value: KIND_DOG, weight: 14 });
  if (stage >= 2) table.push({ value: KIND_OVEN, weight: 16 });
  return table;
}

export function createWorld(seed = 1) {
  const rand = mulberry32(seed);
  const state = freshState();

  function freshState() {
    return {
      time: 0,
      distance: 0,
      score: 0,
      bonus: 0,
      lives: RUN.startLives,
      speed: RUN.startSpeed,
      stage: 0,
      farmerGap: RUN.farmerStartGap,
      over: false,
      escaped: false,
      caught: false,
      invulnerable: 0,
      jumpsUsed: 0,
      slideTimer: 0,
      nextSpawnX: FIELD.width + 200,
      player: {
        x: TURKEY.x,
        y: GROUND_Y - TURKEY.height,
        vy: 0,
        width: TURKEY.width,
        height: TURKEY.height,
        grounded: true,
        sliding: false,
        runPhase: 0,
      },
      obstacles: [],
      pickups: [],
      decor: [],
      stats: { jumps: 0, corn: 0, feathers: 0, pies: 0, hits: 0, bestCombo: 0 },
    };
  }

  function reset() {
    const kept = freshState();
    for (const key of Object.keys(state)) delete state[key];
    Object.assign(state, kept);
    // Decor uses its own stream, so resetting never perturbs the obstacle
    // sequence: a fresh world and a reset one play identically from a seed.
    const decorRand = mulberry32(seed ^ 0x9e3779b9);
    for (let i = 0; i < 14; i += 1) {
      state.decor.push({ x: randFloat(decorRand, 0, FIELD.width), kind: i % 3, wobble: randFloat(decorRand, 0, 6.28) });
    }
  }

  function groundY() {
    return GROUND_Y;
  }

  function playerBox() {
    const p = state.player;
    const h = p.sliding ? TURKEY.slideHeight : TURKEY.height;
    return { x: p.x + 6, y: p.y + (TURKEY.height - h), w: p.width - 12, h: h - 4 };
  }

  function spawnObstacle(x) {
    const kind = weightedPick(rand, obstacleTable(state.stage));
    const spec = OBSTACLES[kind];
    // A hanging knife dangles low enough to threaten a standing turkey
    // (blade bottom ~426) but clears a sliding one (top ~436).
    const y = spec.hangs ? GROUND_Y - 158 : GROUND_Y - spec.height;
    state.obstacles.push({
      kind,
      x,
      y,
      width: spec.width,
      height: spec.height,
      active: true,
      passed: false,
      roll: 0,
    });
  }

  function spawnPickupRow(x) {
    const roll = rand();
    const kind = roll < 0.72 ? KIND_CORN : roll < 0.9 ? KIND_FEATHER : KIND_PIE;
    const spec = PICKUPS[kind];
    const count = kind === KIND_CORN ? randInt(rand, 3, 5) : 1;
    const baseY = kind === KIND_CORN ? GROUND_Y - 130 : GROUND_Y - 170;
    for (let i = 0; i < count; i += 1) {
      state.pickups.push({
        kind,
        x: x + i * 36,
        y: baseY - Math.sin((i / Math.max(1, count - 1)) * Math.PI) * 40,
        width: spec.width,
        height: spec.height,
        active: true,
        bob: randFloat(rand, 0, 6.28),
      });
    }
  }

  function spawnPattern() {
    // Spacing is measured in travel time, so a jump always fits between two
    // obstacles even as the run speeds up — but the margin shrinks with
    // distance, from ~1.15 s early to ~0.95 s near the kitchen.
    const tight = Math.min(0.2, state.distance / 6000);
    const gap = state.speed * randFloat(rand, 1.15 - tight, 1.6 - tight);
    const x = Math.max(state.nextSpawnX, FIELD.width + 60);
    spawnObstacle(x);
    let farX = x;
    if (rand() < 0.55) spawnPickupRow(x + randFloat(rand, 140, 300));
    const pairChance = 0.18 + Math.min(0.17, state.distance / 4000);
    if (state.distance > 150 && rand() < pairChance) {
      const x2 = x + randFloat(rand, 430, 580);
      spawnObstacle(x2);
      farX = x2;
    }
    state.nextSpawnX = farX + Math.max(360, gap);
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function doJump() {
    const p = state.player;
    if (p.grounded) {
      p.vy = TURKEY.jumpVelocity;
      p.grounded = false;
      p.sliding = false;
      state.jumpsUsed = 1;
      state.stats.jumps += 1;
      return EVENT_JUMP;
    }
    if (state.jumpsUsed < 2) {
      p.vy = TURKEY.doubleJumpVelocity;
      state.jumpsUsed = 2;
      state.stats.jumps += 1;
      return EVENT_DOUBLE_JUMP;
    }
    return EVENT_NONE;
  }

  /**
   * Advance the world one fixed step. `input` is { jump, slide }.
   * Returns a bitmask of EVENT_* flags for this step.
   */
  function step(dt, input) {
    if (state.over) return EVENT_NONE;
    let events = EVENT_NONE;
    const p = state.player;
    state.time += dt;

    if (input.jump) events |= doJump();
    if (input.slide && p.grounded) {
      if (!p.sliding) events |= 0;
      p.sliding = true;
      state.slideTimer = TURKEY.slideSeconds;
    }

    // Vertical motion.
    p.vy += TURKEY.gravity * dt;
    p.y += p.vy * dt;
    if (p.y >= GROUND_Y - TURKEY.height) {
      p.y = GROUND_Y - TURKEY.height;
      p.vy = 0;
      p.grounded = true;
      state.jumpsUsed = 0;
    } else {
      p.grounded = false;
    }
    if (p.sliding) {
      state.slideTimer -= dt;
      if (state.slideTimer <= 0 || !p.grounded) p.sliding = false;
    }
    p.runPhase += dt * (p.grounded ? state.speed / 28 : 0);

    // Forward motion, speed and stage.
    state.speed = speedAt(state.distance);
    const dx = state.speed * dt;
    state.distance += dx / PX_PER_METRE;
    const stage = stageIndexAt(state.distance);
    if (stage !== state.stage) {
      state.stage = stage;
      events |= EVENT_STAGE;
    }

    // The farmer: falls behind on clean running, closes in on every stumble.
    state.farmerGap = Math.min(RUN.farmerMaxGap, state.farmerGap + RUN.farmerRecoverPerSecond * dt);
    if (state.invulnerable > 0) state.invulnerable -= dt;

    // Spawning and scrolling.
    while (state.nextSpawnX < FIELD.width + 400) spawnPattern();
    for (const obstacle of state.obstacles) {
      // Most obstacles ride the scroll; the farm dog runs at the turkey.
      const approach = (OBSTACLES[obstacle.kind].approach || 0) * dt;
      obstacle.x -= dx + approach;
      if (obstacle.kind === KIND_PUMPKIN) obstacle.roll += dx / 24;
      if (obstacle.x + obstacle.width < -40) obstacle.active = false;
      if (!obstacle.passed && obstacle.x + obstacle.width < p.x) {
        obstacle.passed = true;
        state.bonus += 5;
      }
    }
    for (const pickup of state.pickups) {
      pickup.x -= dx;
      pickup.bob += dt * 4;
      if (pickup.x + pickup.width < -40) pickup.active = false;
    }
    for (const decor of state.decor) {
      decor.x -= dx * 0.55;
      if (decor.x < -60) {
        decor.x = FIELD.width + randFloat(rand, 0, 240);
        decor.kind = randInt(rand, 0, 2);
      }
    }
    state.obstacles = state.obstacles.filter((o) => o.active);
    state.pickups = state.pickups.filter((o) => o.active);
    state.nextSpawnX -= dx;

    // Pickups.
    const box = playerBox();
    for (const pickup of state.pickups) {
      if (!pickup.active) continue;
      const pb = { x: pickup.x, y: pickup.y + Math.sin(pickup.bob) * 4, w: pickup.width, h: pickup.height };
      if (overlaps(box, pb)) {
        pickup.active = false;
        events |= EVENT_PICKUP;
        if (pickup.kind === KIND_CORN) {
          state.bonus += PICKUPS.corn.score;
          state.stats.corn += 1;
        } else if (pickup.kind === KIND_FEATHER) {
          state.bonus += PICKUPS.feather.score;
          state.stats.feathers += 1;
        } else {
          state.stats.pies += 1;
          if (state.lives < RUN.maxLives) {
            state.lives += 1;
            events |= EVENT_HEART;
          } else {
            state.bonus += PICKUPS.pie.score;
          }
        }
      }
    }

    // Obstacle hits: one heart, a shove from the farmer, brief mercy.
    if (state.invulnerable <= 0) {
      for (const obstacle of state.obstacles) {
        if (!obstacle.active) continue;
        const ob = { x: obstacle.x + 4, y: obstacle.y + 4, w: obstacle.width - 8, h: obstacle.height - 8 };
        if (obstacle.kind === KIND_KNIFE) {
          // A hanging knife only threatens a standing turkey: its blade ends
          // just above a sliding turkey's back.
          if (p.sliding) continue;
          ob.y = GROUND_Y - 118;
          ob.h = 84;
          ob.x = obstacle.x + 6;
          ob.w = obstacle.width - 12;
        }
        if (overlaps(box, ob)) {
          obstacle.active = false;
          state.lives -= 1;
          state.stats.hits += 1;
          state.farmerGap -= RUN.farmerHitPenalty;
          state.invulnerable = RUN.invulnerableSeconds;
          events |= EVENT_HIT;
          break;
        }
      }
    }

    // Score is distance run plus every bonus earned along the way.
    state.score = Math.floor(state.distance) + state.bonus;

    // Caught or escaped?
    if (state.lives <= 0 || state.farmerGap <= RUN.farmerCatchGap) {
      state.over = true;
      state.caught = true;
      events |= EVENT_CAUGHT;
    } else if (state.distance >= RUN.escapeMetres) {
      state.over = true;
      state.escaped = true;
      state.bonus += 500;
      state.score = Math.floor(state.distance) + state.bonus;
      events |= EVENT_ESCAPED;
    }
    return events;
  }

  reset();
  return { state, reset, step, stageIndexAt, speedAt };
}
