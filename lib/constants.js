export const BUTTONS = {
  left: 'left',
  up: 'up',
  down: 'down',
  right: 'right',
  y: 'y',
  b: 'b',
  a: 'a',
  l: 'l',
  r: 'r',
  start: 'start',
  x: 'x',
  select: 'select',
};

export const BUTTON_PRIORITY = [
  BUTTONS.b,
  BUTTONS.y,
  BUTTONS.select,
  BUTTONS.start,
  BUTTONS.up,
  BUTTONS.down,
  BUTTONS.left,
  BUTTONS.right,
  BUTTONS.a,
  BUTTONS.x,
  BUTTONS.l,
  BUTTONS.r,
];

/**
 * Button to pin mapping for controller 1
 *
 * @type {Object}
 */
export const CONTROLLER_ONE_PIN_MAPPING = {
  left: 22,
  up: 27,
  down: 16,
  right: 5,
  y: 23,
  b: 4,
  a: 25,
  l: 6,
  r: 12,
  start: 24,
  x: 13,
  select: 18,
};

/**
 * Button to pin mapping for controller 2
 *
 * @type {Object}
 */
export const CONTROLLER_TWO_PIN_MAPPING = {
  left: 106,
  up: 104,
  down: 105,
  right: 107,
  y: 101,
  b: 100,
  a: 108,
  l: 110,
  r: 111,
  start: 103,
  x: 109,
  select: 102,
};

/**
 * Maximum players supported before name wrapping begins
 *
 * @type {Number}
 */
export const PLAYER_MAX = 65534;

/**
 * Maximum events to display
 */
export const EVENT_MAX = 10;

/**
 * Buffer between flushing of controller output
 */
export const QUEUE_FLUSH_DOWN_TIME = 10; // ms
export const QUEUE_FLUSH_UP_TIME = 50; // ms
export const QUEUE_FLUSH_DEFAULT_TIME = 200; // ms

export const VOTE_SESSION_TIME =
  (QUEUE_FLUSH_DOWN_TIME + QUEUE_FLUSH_UP_TIME + 1) * 2; // ms

/**
 * Maximum input participation to any given voting session
 */
export const VOTE_MAXIMUM = 400;

/**
 * Maximum events
 */
export const QUEUE_MAXIMUM = 100;

/**
 * How long to consider player active without input
 */
export const PLAYER_ACTIVE_LIFETIME = 10000;

export const CORS = {
  origin: ['*'],
  maxAge: 3600,
  credentials: true, // boolean - 'Access-Control-Allow-Credentials'
  additionalExposedHeaders: [
    'WWW-Authenticate',
    'Server-Authorization',
    'Accept',
  ], // an array of exposed headers - 'Access-Control-Expose-Headers',
  additionalHeaders: [
    'Accept',
    'Authorization',
    'Content-Type',
    'If-None-Match',
    'Accept-language',
    'Access-Control-Request-Method',
  ],
};
