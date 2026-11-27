// Turkey Run rendering: every picture on the canvas, drawn from shapes.
// One clear job: given a world state and a screen name, paint the frame.
// All art is original, drawn here in code; no image files are loaded.
import { FIELD, GROUND_Y, TURKEY, RUN, STAGES } from './config.js';
import { SCREENS } from './config.js';

const TAU = Math.PI * 2;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}

function drawSky(ctx, stage, time) {
  const palette = STAGES[stage];
  const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  gradient.addColorStop(0, palette.sky[0]);
  gradient.addColorStop(0.7, palette.sky[1]);
  gradient.addColorStop(1, '#5d4030');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Low autumn sun (or kitchen moon in the last stage).
  ctx.fillStyle = stage === 2 ? '#f5e6c8' : '#fff3b0';
  ellipse(ctx, 830, 84, 34, 34);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 3; i += 1) {
    const cx = ((i * 340 + time * 12) % 1100) - 60;
    const cy = 70 + i * 46;
    ellipse(ctx, cx, cy, 44, 16);
    ellipse(ctx, cx + 30, cy + 6, 34, 13);
  }
}

function drawHills(ctx, stage, distance) {
  const offset = (distance * 8) % 480;
  ctx.fillStyle = stage === 2 ? '#33241d' : '#6b8f3e';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = -480; x <= FIELD.width + 480; x += 120) {
    ctx.quadraticCurveTo(x + 60, GROUND_Y - 90, x + 120, GROUND_Y);
  }
  ctx.lineTo(FIELD.width, FIELD.height);
  ctx.lineTo(0, FIELD.height);
  ctx.closePath();
  ctx.fill();
  void offset;
}

function drawGround(ctx, stage, distance) {
  const palette = STAGES[stage];
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, GROUND_Y, FIELD.width, FIELD.height - GROUND_Y);
  ctx.fillStyle = palette.grass;
  ctx.fillRect(0, GROUND_Y, FIELD.width, 14);
  // Scrolling ground dashes sell the speed.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  const step = 64;
  const shift = (distance * 28) % step;
  for (let x = -step + shift; x < FIELD.width; x += step) {
    ctx.fillRect(x, GROUND_Y + 34, 30, 6);
  }
}

function drawDecor(ctx, state) {
  const stage = state.stage;
  for (const item of state.decor) {
    const x = item.x;
    const bob = Math.sin(state.time * 2 + item.wobble) * 3;
    if (stage === 2) {
      // Kitchen: hanging pans and a window with the moonlit yard.
      ctx.strokeStyle = '#2c1a12';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 60);
      ctx.lineTo(x, 110);
      ctx.stroke();
      ctx.fillStyle = '#3f3f46';
      ellipse(ctx, x, 128 + bob, 22, 22);
      ctx.fillStyle = '#d4d4d8';
      ellipse(ctx, x, 128 + bob, 12, 12);
    } else if (item.kind === 0) {
      // Autumn tree.
      ctx.fillStyle = '#6e4520';
      ctx.fillRect(x - 4, GROUND_Y - 90, 9, 90);
      ctx.fillStyle = stage === 1 ? '#c96f2e' : '#d98a2b';
      ellipse(ctx, x, GROUND_Y - 104, 34, 30);
      ellipse(ctx, x - 22, GROUND_Y - 88, 22, 18);
      ellipse(ctx, x + 22, GROUND_Y - 88, 22, 18);
    } else if (item.kind === 1) {
      // Fence post pair.
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(x - 26, GROUND_Y - 44, 8, 44);
      ctx.fillRect(x + 18, GROUND_Y - 44, 8, 44);
      ctx.fillRect(x - 30, GROUND_Y - 38, 60, 6);
      ctx.fillRect(x - 30, GROUND_Y - 22, 60, 6);
    } else {
      // Pumpkin patch pumpkin.
      ctx.fillStyle = '#e07820';
      ellipse(ctx, x, GROUND_Y - 12, 20, 15);
      ctx.fillStyle = '#c85f10';
      ellipse(ctx, x - 7, GROUND_Y - 12, 8, 14);
      ellipse(ctx, x + 7, GROUND_Y - 12, 8, 14);
      ctx.fillStyle = '#4e7a2e';
      ctx.fillRect(x - 2, GROUND_Y - 30, 4, 10);
    }
  }
}

function drawTurkey(ctx, player, time, invulnerable) {
  const x = player.x;
  const y = player.y;
  const sliding = player.sliding;
  const legSwing = Math.sin(player.runPhase * 2.2) * 10;
  const bob = player.grounded ? Math.abs(Math.sin(player.runPhase * 2.2)) * 3 : 0;
  ctx.save();
  if (invulnerable > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.35;
  ctx.translate(x, y - bob);
  if (sliding) {
    // Low, flat, beak first: sliding under the hanging knives.
    ctx.fillStyle = '#8a5a2b';
    ellipse(ctx, 28, 34, 30, 12);
    ctx.fillStyle = '#a06a35';
    ellipse(ctx, 52, 30, 12, 10);
    ctx.fillStyle = '#e8a13c';
    ctx.beginPath();
    ctx.moveTo(62, 26);
    ctx.lineTo(74, 30);
    ctx.lineTo(62, 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3d2b1f';
    ellipse(ctx, 54, 26, 2.5, 2.5);
    ctx.restore();
    return;
  }
  // Tail feathers, fanned.
  ctx.fillStyle = '#7c4a21';
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.translate(8, 22);
    ctx.rotate(i * 0.42);
    ctx.beginPath();
    ctx.ellipse(-16, 0, 20, 7, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#c98a3d';
  for (let i = -1; i <= 1; i += 1) {
    ctx.save();
    ctx.translate(8, 22);
    ctx.rotate(i * 0.42);
    ctx.beginPath();
    ctx.ellipse(-14, 0, 14, 4.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  // Legs, mid-stride.
  ctx.strokeStyle = '#e8a13c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(26, 44);
  ctx.lineTo(26 + legSwing, 48);
  ctx.moveTo(34, 44);
  ctx.lineTo(34 - legSwing, 48);
  ctx.stroke();
  // Body.
  ctx.fillStyle = '#8a5a2b';
  ellipse(ctx, 28, 28, 24, 19);
  ctx.fillStyle = '#a06a35';
  ellipse(ctx, 30, 30, 17, 13);
  // Wing.
  ctx.fillStyle = '#6e4520';
  ctx.save();
  ctx.translate(26, 28);
  ctx.rotate(player.grounded ? Math.sin(player.runPhase * 2.2) * 0.25 : -0.9);
  ctx.beginPath();
  ctx.ellipse(-4, 0, 14, 8, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Head, beak, wattle, eye.
  ctx.fillStyle = '#a06a35';
  ellipse(ctx, 50, 12, 11, 11);
  ctx.fillStyle = '#e8a13c';
  ctx.beginPath();
  ctx.moveTo(58, 9);
  ctx.lineTo(70, 13);
  ctx.lineTo(58, 17);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d9382b';
  ellipse(ctx, 56, 20, 4, 6);
  ctx.fillStyle = '#3d2b1f';
  ellipse(ctx, 53, 9, 2.5, 2.5);
  // Snood.
  ctx.strokeStyle = '#d9382b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(52, 3);
  ctx.quadraticCurveTo(56, -4, 60, 1);
  ctx.stroke();
  ctx.restore();
}

function drawFarmer(ctx, state) {
  const gap = state.farmerGap;
  if (gap > 250) return;
  const p = state.player;
  const x = p.x - gap + 20;
  const y = GROUND_Y - 74;
  const legSwing = Math.sin(state.time * 14) * 12;
  const visible = Math.max(0, Math.min(1, (250 - gap) / 90));
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.65 * visible;
  // Pitchfork.
  ctx.strokeStyle = '#5d4030';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 52, y + 78);
  ctx.lineTo(x + 62, y + 2);
  ctx.stroke();
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 62 + i * 7, y + 2);
    ctx.lineTo(x + 62 + i * 7, y - 12);
    ctx.stroke();
  }
  // Legs.
  ctx.strokeStyle = '#2e3a59';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x + 22, y + 46);
  ctx.lineTo(x + 22 + legSwing, y + 74);
  ctx.moveTo(x + 34, y + 46);
  ctx.lineTo(x + 34 - legSwing, y + 74);
  ctx.stroke();
  // Body: red flannel shirt.
  ctx.fillStyle = '#b3312a';
  roundRect(ctx, x + 8, y + 16, 40, 34, 8);
  ctx.fill();
  ctx.fillStyle = '#7c1f1a';
  ctx.fillRect(x + 8, y + 30, 40, 4);
  // Head, beard, straw hat.
  ctx.fillStyle = '#e8b98a';
  ellipse(ctx, x + 28, y + 8, 13, 12);
  ctx.fillStyle = '#e8e8e8';
  ellipse(ctx, x + 28, y + 16, 11, 7);
  ctx.fillStyle = '#d9a441';
  ellipse(ctx, x + 28, y - 2, 24, 6);
  roundRect(ctx, x + 16, y - 14, 24, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#3d2b1f';
  ellipse(ctx, x + 33, y + 6, 2, 2);
  ctx.restore();
}

function drawObstacle(ctx, obstacle, time) {
  const { kind, x, y, width, height } = obstacle;
  if (kind === 'fence') {
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(x, y, 6, height);
    ctx.fillRect(x + width - 6, y, 6, height);
    ctx.fillRect(x - 4, y + 8, width + 8, 7);
    ctx.fillRect(x - 4, y + 28, width + 8, 7);
    ctx.fillStyle = '#8a5f38';
    ctx.fillRect(x + 8, y - 6, 5, 10);
    ctx.fillRect(x + width - 13, y - 6, 5, 10);
  } else if (kind === 'haybale') {
    ctx.fillStyle = '#d9a441';
    roundRect(ctx, x, y, width, height, 10);
    ctx.fill();
    ctx.strokeStyle = '#a67c1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, 16, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, 8, 0, TAU);
    ctx.stroke();
  } else if (kind === 'pumpkin') {
    const spin = obstacle.roll || 0;
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(spin);
    ctx.fillStyle = '#e07820';
    ellipse(ctx, 0, 0, 24, 22);
    ctx.fillStyle = '#c85f10';
    ellipse(ctx, -9, 0, 8, 20);
    ellipse(ctx, 9, 0, 8, 20);
    ctx.fillStyle = '#3d2b1f';
    ellipse(ctx, -6, -4, 2.5, 4);
    ellipse(ctx, 6, -4, 2.5, 4);
    ctx.strokeStyle = '#3d2b1f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 6, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#4e7a2e';
    ctx.fillRect(x + width / 2 - 2, y - 8, 4, 10);
  } else if (kind === 'knife') {
    const sway = Math.sin(time * 2.4 + x * 0.05) * 8;
    ctx.strokeStyle = '#2c1a12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + width / 2 + sway, 0);
    ctx.lineTo(x + width / 2 + sway, y + 26);
    ctx.stroke();
    ctx.save();
    ctx.translate(x + width / 2 + sway, y + 30);
    ctx.rotate(0.12);
    ctx.fillStyle = '#8a6d4b';
    roundRect(ctx, -5, -26, 10, 28, 4);
    ctx.fill();
    ctx.fillStyle = '#dfe3e6';
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.lineTo(8, 2);
    ctx.lineTo(2, 92);
    ctx.lineTo(-2, 92);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b9bec2';
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.lineTo(8, 2);
    ctx.lineTo(0, 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (kind === 'oven') {
    ctx.fillStyle = '#3f3f46';
    roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.fillStyle = '#18181b';
    roundRect(ctx, x + 10, y + 14, width - 20, 52, 6);
    ctx.fill();
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.moveTo(x + 22, y + 60);
    ctx.quadraticCurveTo(x + 30, y + 26, x + 40, y + 60);
    ctx.quadraticCurveTo(x + 50, y + 30, x + 58, y + 60);
    ctx.quadraticCurveTo(x + 68, y + 26, x + 78, y + 60);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(x + 14, y + 76, width - 28, 6);
    for (let i = 0; i < 3; i += 1) {
      ellipse(ctx, x + 30 + i * 28, y + 96, 7, 7);
    }
    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OVEN', x + width / 2, y + height - 8);
  } else if (kind === 'net') {    ctx.strokeStyle = '#4a6b2a';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + i * (width / 4), y + height);
      ctx.lineTo(x + width / 2, y - 6);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height - 2, width / 2, 8, 0, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#c65f6e';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRAP', x + width / 2, y + height - 12);
  } else if (kind === 'dog') {
    // The farm dog, sprinting at the turkey: brown, floppy ears, tail up.
    const run = Math.sin(time * 18 + x * 0.1) * 8;
    ctx.fillStyle = '#7a4a21';
    // Tail, wagging.
    ctx.save();
    ctx.translate(x + width - 4, y + 8);
    ctx.rotate(-0.7 + Math.sin(time * 10) * 0.25);
    ctx.fillRect(0, -3, 16, 6);
    ctx.restore();
    // Body and head, facing the turkey (left).
    ellipse(ctx, x + width / 2, y + height - 14, 26, 13);
    ellipse(ctx, x + 12, y + height - 30, 12, 11);
    // Floppy ear.
    ctx.fillStyle = '#5d3413';
    ellipse(ctx, x + 16, y + height - 34, 5, 9);
    // Snout, nose, eye.
    ctx.fillStyle = '#7a4a21';
    ellipse(ctx, x + 2, y + height - 28, 8, 6);
    ctx.fillStyle = '#2b1a12';
    ellipse(ctx, x - 4, y + height - 30, 3, 3);
    ellipse(ctx, x + 10, y + height - 34, 2, 2);
    // Legs, mid-sprint.
    ctx.strokeStyle = '#5d3413';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + height - 4);
    ctx.lineTo(x + 14 + run, y + height);
    ctx.moveTo(x + 26, y + height - 4);
    ctx.lineTo(x + 26 - run, y + height);
    ctx.moveTo(x + 40, y + height - 4);
    ctx.lineTo(x + 40 + run, y + height);
    ctx.moveTo(x + 52, y + height - 4);
    ctx.lineTo(x + 52 - run, y + height);
    ctx.stroke();
  }
}

function drawPickup(ctx, pickup) {
  const bob = Math.sin(pickup.bob) * 4;
  const x = pickup.x;
  const y = pickup.y + bob;
  if (pickup.kind === 'corn') {
    ctx.fillStyle = '#f7c948';
    roundRect(ctx, x, y, 16, 24, 8);
    ctx.fill();
    ctx.fillStyle = '#e0a92e';
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        ellipse(ctx, x + 5 + col * 6, y + 6 + row * 7, 2, 2.5);
      }
    }
    ctx.fillStyle = '#4e7a2e';
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 24);
    ctx.lineTo(x + 2, y + 32);
    ctx.lineTo(x + 14, y + 32);
    ctx.closePath();
    ctx.fill();
  } else if (pickup.kind === 'feather') {
    ctx.fillStyle = '#f7c948';
    ctx.save();
    ctx.translate(x + 15, y + 15);
    ctx.rotate(-0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.ellipse(-4, 0, 8, 3.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  } else {
    // Pumpkin pie slice: a heart for the turkey.
    ctx.fillStyle = '#e07820';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x + 28, y + 8);
    ctx.lineTo(x + 28, y + 22);
    ctx.lineTo(x, y + 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f7c948';
    ctx.fillRect(x, y + 22, 28, 5);
    ctx.fillStyle = '#fff3b0';
    ellipse(ctx, x + 14, y + 6, 6, 4);
    ctx.fillStyle = '#d9382b';
    ellipse(ctx, x + 14, y + 2, 3, 3);
  }
}

function drawHearts(ctx, lives, maxLives) {
  for (let i = 0; i < maxLives; i += 1) {
    const x = 24 + i * 32;
    const y = 30;
    ctx.fillStyle = i < lives ? '#e23b3b' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.bezierCurveTo(x - 12, y - 4, x - 6, y - 12, x, y - 4);
    ctx.bezierCurveTo(x + 6, y - 12, x + 12, y - 4, x, y + 8);
    ctx.fill();
  }
}

function drawHud(ctx, state, best) {
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  // Top bar.
  ctx.fillStyle = 'rgba(20,12,8,0.45)';
  roundRect(ctx, 12, 10, 420, 54, 10);
  ctx.fill();
  drawHearts(ctx, state.lives, RUN.maxLives);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${state.score}`, 130, 38);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(`${Math.floor(state.distance)} m  ·  BEST ${best}`, 130, 56);
  // Stage + farmer proximity, top right.
  ctx.fillStyle = 'rgba(20,12,8,0.45)';
  roundRect(ctx, FIELD.width - 268, 10, 256, 54, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(STAGES[state.stage].name, FIELD.width - 24, 32);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = state.farmerGap < 90 ? '#ff6b5e' : '#ffe9a8';
  ctx.fillText(state.farmerGap < 90 ? 'THE FARMER IS CLOSE!' : 'Farmer behind you', FIELD.width - 24, 52);
  // Farmer gap bar.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, FIELD.width - 268, 68, 256, 8, 4);
  ctx.fill();
  ctx.fillStyle = state.farmerGap < 90 ? '#e23b3b' : '#7fae4c';
  const gapW = 256 * (state.farmerGap / RUN.farmerMaxGap);
  roundRect(ctx, FIELD.width - 268, 68, Math.max(8, gapW), 8, 4);
  ctx.fill();
  // Controls hint, bottom.
  ctx.fillStyle = 'rgba(20,12,8,0.4)';
  roundRect(ctx, 12, FIELD.height - 34, 430, 24, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SPACE / CLICK jump ×2   ·   ↓ slide   ·   P pause   ·   M mute', 22, FIELD.height - 17);
  ctx.restore();
}

function panel(ctx, title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,12,8,0.62)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, FIELD.width / 2 - 290, 92, 580, 356, 18);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3d2b1f';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(title, FIELD.width / 2, 158);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#5d4030';
  let y = 198;
  for (const line of lines) {
    ctx.fillText(line, FIELD.width / 2, y);
    y += 30;
  }
  ctx.restore();
}

function drawTitle(ctx, state, best) {
  drawSky(ctx, 0, state.time);
  drawHills(ctx, 0, state.distance);
  drawDecor(ctx, state);
  drawGround(ctx, 0, state.distance);
  drawTurkey(ctx, state.player, state.time, 0);
  ctx.save();
  ctx.fillStyle = 'rgba(20,12,8,0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcf5e';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('TURKEY RUN', FIELD.width / 2, 150);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Gobble Dash: escape Thanksgiving dinner!', FIELD.width / 2, 192);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('The farmer is coming with his carving knife. Run, jump, slide —', FIELD.width / 2, 238);
  ctx.fillText('grab corn, dodge the oven, and reach the forest 1200 m away.', FIELD.width / 2, 264);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('SPACE / CLICK — jump (twice in the air)      ↓ — slide', FIELD.width / 2, 312);
  ctx.fillText('Dodge fences, hay bales, pumpkins, knives, the farm dog and the oven.', FIELD.width / 2, 340);
  ctx.fillStyle = '#ffcf5e';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(best > 0 ? `Best score: ${best}  ·  Press ENTER or CLICK to run` : 'Press ENTER or CLICK to run', FIELD.width / 2, 396);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText('P pause   ·   M mute   ·   R restart', FIELD.width / 2, 432);
  ctx.restore();
}

function drawCaught(ctx, state) {
  panel(ctx, 'CAUGHT!', [
    'The farmer caught up — Thanksgiving dinner is served.',
    `You ran ${Math.floor(state.distance)} m and scored ${state.score}.`,
    `Corn ${state.stats.corn}  ·  Feathers ${state.stats.feathers}  ·  Jumps ${state.stats.jumps}`,
    'Press R or CLICK to run again.',
  ], '#e23b3b');
}

function drawEscaped(ctx, state) {
  panel(ctx, 'ESCAPED!', [
    'You made it to the forest — no Thanksgiving dinner this year!',
    `You ran ${Math.floor(state.distance)} m and scored ${state.score}.`,
    `Corn ${state.stats.corn}  ·  Feathers ${state.stats.feathers}  ·  Jumps ${state.stats.jumps}`,
    'Press R or CLICK to run again.',
  ], '#7fae4c');
}

function drawPaused(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,12,8,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2);
  ctx.font = '18px sans-serif';
  ctx.fillText('Press P to keep running', FIELD.width / 2, FIELD.height / 2 + 36);
  ctx.restore();
}

/** Paint one frame. `screen` is one of SCREENS; `paused` draws the pause veil. */
export function render(ctx, state, screen, best, paused) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (screen === SCREENS.TITLE) {
    drawTitle(ctx, state, best);
    return;
  }
  if (screen === SCREENS.CAUGHT || screen === SCREENS.ESCAPED) {
    drawSky(ctx, state.stage, state.time);
    drawHills(ctx, state.stage, state.distance);
    drawDecor(ctx, state);
    drawGround(ctx, state.stage, state.distance);
    for (const obstacle of state.obstacles) drawObstacle(ctx, obstacle, state.time);
    for (const pickup of state.pickups) drawPickup(ctx, pickup);
    drawFarmer(ctx, state);
    drawTurkey(ctx, state.player, state.time, 0);
    drawHud(ctx, state, best);
    if (screen === SCREENS.CAUGHT) drawCaught(ctx, state);
    else drawEscaped(ctx, state);
    return;
  }
  drawSky(ctx, state.stage, state.time);
  drawHills(ctx, state.stage, state.distance);
  drawDecor(ctx, state);
  drawGround(ctx, state.stage, state.distance);
  for (const pickup of state.pickups) drawPickup(ctx, pickup);
  for (const obstacle of state.obstacles) drawObstacle(ctx, obstacle, state.time);
  drawFarmer(ctx, state);
  drawTurkey(ctx, state.player, state.time, state.invulnerable);
  drawHud(ctx, state, best);
  if (paused) drawPaused(ctx);
}

export { SCREENS };
