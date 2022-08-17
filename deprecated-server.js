import Hapi from '@hapi/hapi';
import Nes from '@hapi/nes';
import hapiRateLimit from 'hapi-rate-limit';
import {
  PLAYER_MAX,
  CONTROLLER_ONE_PIN_MAPPING,
  CONTROLLER_TWO_PIN_MAPPING,
  PLAYER_ACTIVE_LIFETIME,
} from './lib/constants.js';
import { DemocracyCounter } from './lib/democracy-counter.js';
import { ClockedQueue } from './lib/queue.js';
import axios from 'axios';

const controllerOneCounter = new DemocracyCounter();
const controllerTwoCounter = new DemocracyCounter();
const clockedOneQueue = new ClockedQueue();
const clockedTwoQueue = new ClockedQueue();

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
function pushQueue(pin, direction, secondary) {
  if (secondary) {
    clockedTwoQueue.push({ pin, direction });
    clockedTwoQueue.run();
  } else {
    clockedOneQueue.push({ pin, direction });
    clockedOneQueue.run();
  }
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
    }, PLAYER_ACTIVE_LIFETIME);
  }
}

/**
 * Responder for pin
 *
 * @param {Object} request
 * @param {Object} h
 * @return {Object}
 */
function sharedHandler(request, h, dictatorMode) {
  const controller = parseInt(request?.payload?.controller, 10);
  const button = request.params.button;
  const user = request?.state?.user;
  let name;

  if (user?.length) {
    name = user[0].name;
  } else {
    name = user?.name;
  }

  if (
    !buttonValidate(button) &&
    !CONTROLLER_ONE_PIN_MAPPING[button] &&
    !CONTROLLER_TWO_PIN_MAPPING[button]
  ) {
    return h.response('Bad request').code(400);
  }

  insertTimedName(name);

  if (dictatorMode) {
    console.log('Dictator mode');
    if (controller === 2) {
      console.info(`Controller 2 pressed ${button}`);
      pushQueue(CONTROLLER_TWO_PIN_MAPPING[button], 'down', true);
      pushQueue(CONTROLLER_TWO_PIN_MAPPING[button], 'up', true);
    } else {
      console.info(`Controller 1 pressed ${button}`);
      pushQueue(CONTROLLER_ONE_PIN_MAPPING[button], 'down');
      pushQueue(CONTROLLER_ONE_PIN_MAPPING[button], 'up');
    }
  } else {
    if (controller === 2) {
      controllerTwoCounter.vote(button);
    } else {
      controllerOneCounter.vote(button);
    }
  }

  return h.response('OK');
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

  await server.register([
    {
      plugin: hapiRateLimit,
      options: {
        enabled: true,
        pathLimit: false,
        userLimit: 1000,
        userCache: {
          expiresIn: 10000,
        },
        headers: false,
      },
    },
    {
      plugin: Nes,
      options: {
        auth: {
          type: 'cookie',
        },
      },
    },
  ]);

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
    method: 'POST',
    path: '/api/press/{button}',
    config: {
      id: 'down',
      handler: async (request, h) => {
        return sharedHandler(request, h, false);
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/assign',
    config: {
      handler: (request, h) => {
        const user = request?.state?.user;
        let name;

        if (user?.length) {
          name = user[0].name;
        } else {
          name = user?.name;
        }

        insertTimedName(name);

        if (!name) {
          name = generateAnonymous();
          console.log(`New player added ${name}`);
        }

        const player = playerMap[name] || {
          name,
        };

        playerMap[name] = player;

        return h.response('OK').state('user', { name });
      },
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
  controllerOneCounter.run((buttonOne) => {
    const message = `Controller 1 pressed ${buttonOne}`.toUpperCase();

    console.info(message);
    pushQueue(CONTROLLER_ONE_PIN_MAPPING[buttonOne], 'down');
    pushQueue(CONTROLLER_ONE_PIN_MAPPING[buttonOne], 'up');

    // axios.get(`http://192.168.86.36:8000/text/${message}`).catch((error) => {
    //   console.error(error);
    // });
  });

  controllerTwoCounter.run((buttonTwo) => {
    const message = `Controller 2 pressed ${buttonTwo}`.toUpperCase();
    console.info(message);
    pushQueue(CONTROLLER_TWO_PIN_MAPPING[buttonTwo], 'down', true);
    pushQueue(CONTROLLER_TWO_PIN_MAPPING[buttonTwo], 'up', true);
    // axios.get(`http://192.168.86.36:8000/text/${message}`).catch((error) => {
    //   console.error(error);
    // });
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
