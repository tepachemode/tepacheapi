import Hapi from '@hapi/hapi';
import hapiRateLimit from 'hapi-rate-limit';
import {
  PLAYER_MAX,
  CONTROLLER_ONE_PIN_MAPPING,
  CONTROLLER_TWO_PIN_MAPPING,
  VOTE_SESSION_TIME,
} from './lib/constants.js';
import { DemocracyCounter } from './lib/democracy-counter.js';
import { ClockedQueue } from './lib/queue.js';

const controllerOneCounter = new DemocracyCounter();
const controllerTwoCounter = new DemocracyCounter();
const clockedQueue = new ClockedQueue();

const players = new Set();
const playerMap = {};
const timerMap = {
  // name: setTimeoutInstance
};

let playerIncrement = 0;

/**
 * Push to action queue
 *
 * @param {*} pin
 * @param {*} direction
 * @param {*} player
 */
function pushQueue(pin, direction) {
  clockedQueue.push({ pin, direction });
  clockedQueue.run();
}

/**
 * Generate incremented number
 * @returns
 */
function generateNumber() {
  if (playerIncrement >= PLAYER_MAX) {
    playerIncrement = 0;
  }

  return ++playerIncrement;
}

/**
 * Generates anonymous name
 *
 * @returns
 */
function generateAnonymous() {
  return `Anonymous${generateNumber()}`;
}

/**
 * True if good
 *
 * @param {String} button
 */
function buttonValidate(button) {
  if (typeof button !== 'string') {
    return false;
  }

  return true;
}

/**
 * Responder for pin
 *
 * @param {Object} request
 * @param {Object} h
 * @return {Object}
 */
function insertTimedName(name) {
  if (name) {
    players.add(name);
    clearTimeout(timerMap[name]);
    timerMap[name] = setTimeout(() => {
      players.delete(name);
    }, 30000);
  }
}

/**
 * Responder for pin
 *
 * @param {Object} request
 * @param {Object} h
 * @return {Object}
 */
function sharedHandler(request, h) {
  const controller = parseInt(request?.query?.controller, 10);
  const button = request.params.button;
  const user = request?.state?.user;
  let name;

  if (user?.length) {
    name = user[0].name;
  } else {
    name = user?.name;
  }

  if (!name) {
    name = generateAnonymous();
  }

  if (
    !buttonValidate(button) &&
    !CONTROLLER_ONE_PIN_MAPPING[button] &&
    !CONTROLLER_TWO_PIN_MAPPING[button]
  ) {
    return h.response('Bad request').code(400);
  }

  insertTimedName(name);

  const player = playerMap[name] || {
    name,
  };

  playerMap[name] = player;

  if (controller === 2) {
    controllerTwoCounter.vote(button);
  } else {
    controllerOneCounter.vote(button);
  }

  return h.response('OK').state('user', { name });
}

const init = async () => {
  const server = Hapi.server({
    port: 8001,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['https://stream.biglargeclarke.com'], // an array of origins or 'ignore'
        maxAge: 60,
        credentials: true, // boolean - 'Access-Control-Allow-Credentials'
      },
    },
  });

  await server.register({
    plugin: hapiRateLimit,
    options: {
      enabled: true,
      pathLimit: false,
      userLimit: 10000,
      userCache: {
        expiresIn: 10000,
      },
      headers: false,
    },
  });

  server.state('user', {
    ttl: 1000 * 60 * 60 * 24,
    domain: '.biglargeclarke.com',
    path: '/',
    isSecure: true,
    isHttpOnly: false,
    encoding: 'base64json',
    clearInvalid: true,
    strictHeader: true,
  });

  server.route({
    method: 'GET',
    path: '/api/down/{button}',
    handler: (request, h) => {
      return sharedHandler(request, h);
    },
  });

  server.route({
    method: '*',
    path: '/{any*}',
    handler: function (request, h) {
      return h.response('Not found').code(404);
    },
  });

  /**
   * Initiate forever cycling of voting
   */
  setInterval(() => {
    controllerOneCounter.close();
    controllerTwoCounter.close();
    const winnerOnePin =
      CONTROLLER_ONE_PIN_MAPPING[controllerOneCounter.score()];
    const winnerTwoPin =
      CONTROLLER_TWO_PIN_MAPPING[controllerTwoCounter.score()];

    if (winnerOnePin) {
      pushQueue(winnerOnePin, 'down');
      pushQueue(winnerOnePin, 'up');
    }

    if (winnerTwoPin) {
      pushQueue(winnerTwoPin, 'down');
      pushQueue(winnerTwoPin, 'up');
    }

    controllerOneCounter.open();
    controllerTwoCounter.open();
  }, VOTE_SESSION_TIME);

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
