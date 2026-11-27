// Turkey Run: the game loop and the screen state machine. One clear job:
// own the canvas, the clock and the screens; the world simulates, the
// renderer paints, the input and the audio plug in here.
// Served by any static server: game/index.html opens and plays offline.
//   ?shot=title|play|kitchen|caught|escaped  stages a deterministic scene
//   (used for the screenshots in screenshots/) instead of starting live.
import { FIELD, STEP, SCREENS } from './config.js';
import { createWorld, EVENT_HIT, EVENT_PICKUP, EVENT_CAUGHT, EVENT_ESCAPED, EVENT_JUMP, EVENT_DOUBLE_JUMP, EVENT_HEART, EVENT_STAGE } from './world.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') || '1', 10);
const seed = Number.isFinite(seedParam) ? seedParam : 1;

const world = createWorld(seed);
const audio = createAudio();
const input = createInput(canvas);

let screen = SCREENS.TITLE;
let paused = false;
let best = 0;
try {
  best = Number(window.localStorage.getItem('turkey-run-best') || 0) || 0;
} catch {
  best = 0;
}

function saveBest() {
  if (world.state.score > best) {
    best = world.state.score;
    try {
      window.localStorage.setItem('turkey-run-best', String(best));
    } catch {
      // Storage may be unavailable (private mode, hosted page): best is in-memory then.
    }
  }
}

function resize() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.width = Math.floor(FIELD.width * scale);
  canvas.height = Math.floor(FIELD.height * scale);
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function announce(text) {
  if (status) status.textContent = text;
}

function startRun() {
  world.reset();
  screen = SCREENS.PLAY;
  paused = false;
  audio.unlock();
  audio.gobble();
  announce('Running! Jump the fences, slide under the knives.');
}

function endRun(escaped) {
  screen = escaped ? SCREENS.ESCAPED : SCREENS.CAUGHT;
  saveBest();
  if (escaped) {
    audio.escaped();
    announce(`Escaped! Score ${world.state.score}. Press R to run again.`);
  } else {
    audio.caught();
    announce(`Caught! Score ${world.state.score}. Press R to run again.`);
  }
}

function handleEvents(events) {
  if (events & EVENT_JUMP) audio.jump();
  if (events & EVENT_DOUBLE_JUMP) audio.doubleJump();
  if (events & EVENT_PICKUP) audio.corn();
  if (events & EVENT_HEART) audio.pie();
  if (events & EVENT_HIT) {
    audio.hit();
    announce(`Ouch! ${world.state.lives} lives left, the farmer is closer.`);
  }
  if (events & EVENT_STAGE) {
    audio.feather();
    announce(`Now in the ${['farmyard', 'barn', 'kitchen'][world.state.stage]} — it gets faster.`);
  }
  if (events & EVENT_CAUGHT) endRun(false);
  if (events & EVENT_ESCAPED) endRun(true);
}

function frame(now) {
  const actions = input.takeActions();
  if (actions.mute) {
    const muted = audio.toggleMute();
    announce(muted ? 'Sound off.' : 'Sound on.');
  }
  if (shotName) {
    // Screenshot mode: one staged frame, no loop, no input.
    render(ctx, world.state, screen, best, false);
    return;
  }
  if (actions.pause && screen === SCREENS.PLAY) {
    paused = !paused;
    announce(paused ? 'Paused.' : 'Running!');
  }
  if (actions.start && screen === SCREENS.TITLE) startRun();
  if (actions.restart && screen !== SCREENS.TITLE) startRun();
  if (actions.any && (screen === SCREENS.CAUGHT || screen === SCREENS.ESCAPED)) startRun();

  if (screen === SCREENS.PLAY && !paused) {
    const frameInput = input.takeFrame();
    const events = world.step(STEP, frameInput);
    handleEvents(events);
  } else {
    input.takeFrame();
  }
  render(ctx, world.state, screen, best, paused);
  void now;
}

// Screenshot mode stages the scene once and paints it; live mode loops.
if (shotName) {
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  best = staged.best;
  render(ctx, world.state, screen, best, false);
  document.title = `Turkey Run — ${shotName}`;
} else {
  let last = performance.now();
  let accumulator = 0;
  const loop = (now) => {
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      frame(now);
      accumulator -= STEP;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  // A click anywhere starts the run from the title or restarts after the end.
  canvas.addEventListener('pointerdown', () => {
    if (screen === SCREENS.TITLE || screen === SCREENS.CAUGHT || screen === SCREENS.ESCAPED) startRun();
  });
}
