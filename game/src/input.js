// Keyboard, mouse and touch input for Turkey Run. One clear job: turn raw
// events into the tiny intent object the world steps on, and remember the
// one-shot actions (jump pressed, restart pressed) until the loop consumes them.
export function createInput(canvas, callbacks) {
  const state = {
    jumpQueued: false,
    slideHeld: false,
    restartQueued: false,
    startQueued: false,
    pauseQueued: false,
    muteQueued: false,
    anyQueued: false,
  };

  function queueJump() {
    state.jumpQueued = true;
    state.anyQueued = true;
  }

  function onKeyDown(event) {
    const key = event.key;
    if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') {
      event.preventDefault();
      if (!event.repeat) queueJump();
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      event.preventDefault();
      state.slideHeld = true;
    } else if (key === 'r' || key === 'R') {
      state.restartQueued = true;
      state.anyQueued = true;
    } else if (key === 'Enter') {
      state.startQueued = true;
      state.anyQueued = true;
    } else if (key === 'p' || key === 'P' || key === 'Escape') {
      state.pauseQueued = true;
    } else if (key === 'm' || key === 'M') {
      state.muteQueued = true;
    }
  }

  function onKeyUp(event) {
    const key = event.key;
    if (key === 'ArrowDown' || key === 's' || key === 'S') state.slideHeld = false;
  }

  function onPointerDown(event) {
    event.preventDefault();
    queueJump();
    if (callbacks && callbacks.onPointer) callbacks.onPointer(event);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    state,
    /** The held intent for this frame: jump edge + slide held. */
    takeFrame() {
      const frame = { jump: state.jumpQueued, slide: state.slideHeld };
      state.jumpQueued = false;
      return frame;
    },
    /** One-shot UI actions; clears them after reading. */
    takeActions() {
      const actions = {
        restart: state.restartQueued,
        start: state.startQueued,
        pause: state.pauseQueued,
        mute: state.muteQueued,
        any: state.anyQueued,
      };
      state.restartQueued = false;
      state.startQueued = false;
      state.pauseQueued = false;
      state.muteQueued = false;
      state.anyQueued = false;
      return actions;
    },
  };
}
