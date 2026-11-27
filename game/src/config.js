// Turkey Run: tuning numbers in one place. One clear job: constants only.
// The turkey sprints from the farmyard, through the barn, to the kitchen, and
// out to the forest. Distance is measured in metres; the world scrolls in px.
export const FIELD = { width: 960, height: 540 };
export const GROUND_Y = 462;
export const PX_PER_METRE = 28;

export const TURKEY = {
  x: 170,
  width: 56,
  height: 48,
  slideHeight: 26,
  gravity: 2400,
  jumpVelocity: -950,
  doubleJumpVelocity: -850,
  slideSeconds: 0.5,
};

export const RUN = {
  startSpeed: 260,
  speedPerMetre: 0.22,
  maxSpeed: 560,
  startLives: 3,
  maxLives: 3,
  escapeMetres: 1200,
  farmerStartGap: 230,
  farmerMaxGap: 260,
  farmerCatchGap: 12,
  farmerHitPenalty: 100,
  farmerRecoverPerSecond: 10,
  invulnerableSeconds: 1.2,
};

// Stage boundaries in metres, and the look of each stretch of the escape.
export const STAGES = [
  { until: 300, name: 'FARMYARD', sky: ['#ffd98e', '#ff9e5e'], ground: '#8a5a2b', grass: '#7fae4c' },
  { until: 700, name: 'BARN', sky: ['#f7a56b', '#c65f6e'], ground: '#6e4520', grass: '#a8893f' },
  { until: Infinity, name: 'KITCHEN', sky: ['#3d2b4f', '#8e3b46'], ground: '#4a2c1e', grass: '#5d4030' },
];

// Obstacles: kind, size, whether the turkey jumps it or slides under it.
export const OBSTACLES = {
  fence: { width: 46, height: 60, way: 'jump' },
  haybale: { width: 66, height: 54, way: 'jump' },
  pumpkin: { width: 48, height: 46, way: 'jump', rolls: true },
  knife: { width: 30, height: 120, way: 'slide', hangs: true },
  oven: { width: 116, height: 122, way: 'jump', minStage: 2 },
  net: { width: 70, height: 26, way: 'jump' },
  // The farm dog sprints at the turkey, faster than the world scrolls.
  dog: { width: 64, height: 40, way: 'jump', approach: 130, minStage: 1 },
};

export const PICKUPS = {
  corn: { width: 26, height: 30, score: 10 },
  feather: { width: 30, height: 30, score: 50 },
  pie: { width: 32, height: 28, score: 100 },
};

export const STEP = 1 / 60;
export const SCREENS = { TITLE: 'title', PLAY: 'play', CAUGHT: 'caught', ESCAPED: 'escaped' };
