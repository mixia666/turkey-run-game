// Screenshot scenes behind ?shot=title|play|caught|escaped. Each one plays the
// real rules forward from a fresh world, steered by a simple autopilot, so the
// frame is what a short game really looks like and the same seed always
// gives the same frame. Never edited, never composited: the game draws it.
import { FIELD, GROUND_Y, TURKEY, OBSTACLES, STEP } from './config.js';
import { SCREENS } from './config.js';
import {
  EVENT_CAUGHT,
  EVENT_ESCAPED,
  KIND_KNIFE,
} from './world.js';

const SAMPLE = 1 / 30;

/** The autopilot: jump before a jumpable obstacle, slide under a knife. */
export function autopilot(world) {
  const state = world.state;
  const p = state.player;
  const lookAhead = 280 + state.speed * 0.35;
  let threat = null;
  for (const obstacle of state.obstacles) {
    if (!obstacle.active) continue;
    // Still a threat while its back edge has not passed the turkey; the gap
    // may already be negative when the turkey is landing on top of it.
    if (obstacle.x + obstacle.width < p.x - 20) continue;
    const gap = obstacle.x - (p.x + p.width);
    if (gap > lookAhead) continue;
    if (!threat || obstacle.x < threat.x) threat = obstacle;
  }
  if (!threat) return { jump: false, slide: false };
  const gap = threat.x - (p.x + p.width);
  // The farm dog runs at the turkey, so it closes the gap faster than the scroll.
  const effSpeed = state.speed + (OBSTACLES[threat.kind].approach || 0);
  if (threat.kind === KIND_KNIFE) {
    if (p.grounded) return { jump: false, slide: gap < 180 };
    // Airborne over a knife, falling: only spend the second jump when the
    // current jump would actually hit the blade.
    if (p.vy > 0 && state.jumpsUsed < 2 && willHit(p, effSpeed, threat)) return { jump: true, slide: false };
    return { jump: false, slide: false };
  }
  // On the ground, jump early enough to clear wide obstacles.
  if (p.grounded && gap < 150 + threat.width * 0.3) return { jump: true, slide: false };
  // In the air and falling, spend the second jump only when the current jump
  // would hit the obstacle; otherwise ride it out and jump after landing.
  // (While still rising the projection is meaningless: the turkey has not
  // finished climbing past the obstacle yet.)
  if (!p.grounded && p.vy > 0 && state.jumpsUsed < 2 && willHit(p, effSpeed, threat)) {
    return { jump: true, slide: false };
  }
  return { jump: false, slide: false };
}

/** Seconds until the airborne turkey touches the ground from here. */
function timeToLand(p) {
  const groundTop = GROUND_Y - TURKEY.height;
  const dy = groundTop - p.y;
  if (dy <= 0) return 0;
  const g = TURKEY.gravity;
  return (Math.sqrt(p.vy * p.vy + 2 * g * dy) - p.vy) / g;
}

/** The top edge of an obstacle's collision box. A hanging knife's blade
 *  starts lower than the rope it hangs from. */
function threatTop(obstacle) {
  return obstacle.kind === KIND_KNIFE ? GROUND_Y - 118 : obstacle.y;
}

/**
 * Would the turkey hit `obstacle` if it keeps falling on its current jump?
 * The turkey overlaps the obstacle from when its beak reaches the near edge
 * until its tail clears the far edge; it hits when its belly is below the
 * obstacle's top at either end of that window (its belly is lowest at the
 * ends, the flight being a parabola). Landing before the obstacle means the
 * ground jump handles it, so that is not a hit.
 */
function willHit(p, speed, obstacle) {
  const frontX = p.x + p.width;
  const top = threatTop(obstacle);
  const tNear = Math.max(0, (obstacle.x - frontX) / speed);
  const tFar = (obstacle.x + obstacle.width - p.x) / speed;
  const tLand = timeToLand(p);
  if (tLand <= tNear) return false;
  const bottomAt = (t) => {
    const tt = Math.min(t, tLand);
    return p.y + TURKEY.height + p.vy * tt + 0.5 * TURKEY.gravity * tt * tt;
  };
  return Math.max(bottomAt(tNear), bottomAt(tFar)) > top;
}

/** The lazy pilot: never jumps, so the turkey is caught fast. */
function idlePilot() {
  return { jump: false, slide: false };
}

function stepFor(world, seconds, pilot) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const events = world.step(STEP, pilot(world));
    if (events & EVENT_CAUGHT || events & EVENT_ESCAPED) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Unknown names stage the title.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    stepFor(world, 22, autopilot);
    return { screen: SCREENS.PLAY, best: world.state.score };
  }
  if (name === 'kitchen') {
    stepFor(world, 75, autopilot);
    return { screen: SCREENS.PLAY, best: world.state.score };
  }
  if (name === 'caught') {
    stepFor(world, 600, idlePilot);
    return { screen: world.state.caught ? SCREENS.CAUGHT : SCREENS.PLAY, best: world.state.score };
  }
  if (name === 'escaped') {
    stepFor(world, 600, autopilot);
    if (world.state.caught) return { screen: SCREENS.CAUGHT, best: world.state.score };
    return { screen: world.state.escaped ? SCREENS.ESCAPED : SCREENS.PLAY, best: world.state.score };
  }
  // Title: a few seconds of the farmyard running behind the title card.
  stepFor(world, 4, autopilot);
  return { screen: SCREENS.TITLE, best: 0 };
}

export { SAMPLE, FIELD, GROUND_Y };
