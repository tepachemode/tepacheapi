import hapiBasic from '@hapi/basic';
import Hapi from '@hapi/hapi';
import Nes from '@hapi/nes';
import hapiPino from 'hapi-pino';
import hapiRateLimit from 'hapi-rate-limit';
import { SESSION_MAX } from './constants/session-max.js';
import { heartbeatHandler } from './handlers/heartbeat-handler.js';
import { gameSessionsPostHandler } from './handlers/game-sessions-handler.js';
import {
  playerSessionsFindHandler,
  playerSessionsGetHandler,
  playerSessionsPatchHandler,
  playerSessionsPostHandler,
} from './handlers/player-sessions-handler.js';
import {
  sessionCapturesPostHandler,
  sessionCapturesTwilioSMSHandler,
} from './handlers/session-captures-handler.js';
import { CORS } from './lib/constants.js';
import { GameSessionsResource } from './resources/game-sessions-resource.js';
import { GamesResource } from './resources/games-resource.js';
import { HardwareInputsResource } from './resources/hardware-inputs-resource.js';
import { LogsResource } from './resources/logs-resource.js';
import { PlayerSessionsResource } from './resources/player-sessions-resource.js';
import { AdminsResource } from './resources/admins-resource.js';
import { SessionCapturesResource } from './resources/session-captures-resource.js';
import { Authentication } from './services/authentication.js';
import { Firebase } from './services/firebase.js';
import { Firestore } from './services/firestore.js';
import { GameFacade } from './services/game-facade.js';
import PubNub from 'pubnub';
import {
  PORT,
  PUBNUB_SUBSCRIBE_KEY,
  PUBNUB_PUBLISH_KEY,
  PUBNUB_USER_ID,
} from './config.js';

const firebase = new Firebase();

await firebase.register();

const firestore = new Firestore(firebase);
const authentication = new Authentication(firebase);

const playerSessionsResource = new PlayerSessionsResource(firestore);
const gameSessionsResource = new GameSessionsResource(firestore);
const gamesResource = new GamesResource(firestore);
const hardwareInputsResource = new HardwareInputsResource(firestore);
const sessionCapturesResource = new SessionCapturesResource(firestore);
const logsResource = new LogsResource(firestore);
const adminsResource = new AdminsResource(firestore);

const pubnub = new PubNub({
  userId: PUBNUB_USER_ID,
  subscribeKey: PUBNUB_SUBSCRIBE_KEY,
  publishKey: PUBNUB_PUBLISH_KEY,
  logVerbosity: false,
  ssl: true,
  heartbeatInterval: 12,
  restore: false,
  keepAlive: false,
  suppressLeaveEvents: true,
});

const gameFacade = new GameFacade(
  gameSessionsResource,
  hardwareInputsResource,
  logsResource,
  playerSessionsResource,
  sessionCapturesResource,
  pubnub
);

let sessionIncrement = 0;

/**
 * Generate incremented number
 * @returns
 */
function generateNumber() {
  if (sessionIncrement >= SESSION_MAX) {
    sessionIncrement = 0;
  }

  return ++sessionIncrement;
}

/**
 * Generates anonymous name
 *
 * @returns
 */
function generateAnonymous() {
  return `Anonymous${generateNumber()}`;
}

(async () => {
  const server = Hapi.server({
    // do not forget to read this from process
    debug: {
      log: ['*'],
      request: ['*'],
    },
    port: PORT,
    host: '0.0.0.0',
    routes: {
      cors: CORS,
    },
  });

  await server.register([
    {
      plugin: hapiRateLimit,
      options: {
        enabled: true,
        pathLimit: 1000,
        userLimit: 100,
        userPathLimit: 10,
        userCache: {
          expiresIn: 1000,
        },
        pathCache: {
          expiresIn: 1000,
        },
        userPathCache: {
          expiresIn: 1000,
        },
        headers: false,
      },
    },
    {
      plugin: hapiPino,
      options: {
        // Redact Authorization headers, see https://getpino.io/#/docs/redaction
        redact: ['req.headers.authorization'],
      },
    },
    {
      plugin: hapiBasic,
    },
  ]);

  // This works super poorly for JWT so hacks are warranted
  const validate = async (request) => {
    const [, token] = request.headers.authorization.split('Basic ');
    return {
      isValid: true,
      credentials: {
        authorization: token,
      },
    };
  };

  server.auth.strategy('socket', 'basic', { validate });

  await server.register([
    {
      plugin: Nes,
      options: {
        auth: {
          type: 'direct',
          route: 'socket',
        },
      },
    },
  ]);

  // https://jsonapi.org/format/

  server.route({
    method: 'POST',
    path: '/api/tepache-games', // create
    handler: async (request, h) => {
      return h.response('Not implemented').code(501);
    },
  });

  server.route({
    method: 'POST',
    path: '/api/tepache-game-sessions', // create
    ...gameSessionsPostHandler(
      authentication,
      gameSessionsResource,
      gamesResource
    ),
  });

  server.route({
    method: 'GET',
    path: '/api/tepache-player-sessions/{playerSessionUrn}',
    ...playerSessionsFindHandler(authentication, playerSessionsResource),
  });

  server.route({
    method: 'GET',
    path: '/api/tepache-player-sessions',
    ...playerSessionsGetHandler(
      authentication,
      playerSessionsResource,
      adminsResource
    ),
  });

  server.route({
    method: 'POST',
    path: '/api/tepache-player-sessions',
    ...playerSessionsPostHandler(
      authentication,
      playerSessionsResource,
      generateAnonymous,
      logsResource
    ),
  });

  server.route({
    method: 'PATCH',
    path: '/api/tepache-player-sessions/{playerSessionDocumentId}',
    ...playerSessionsPatchHandler(
      authentication,
      playerSessionsResource,
      generateAnonymous
    ),
  });

  server.route({
    method: 'POST',
    path: '/api/socket/heartbeat',
    ...heartbeatHandler(authentication, playerSessionsResource),
  });

  server.route({
    method: 'POST',
    path: '/api/tepache-session-captures', // create
    handler: async (request, h) => {
      return h.response('Not implemented').code(501);
    },
  });

  server.route({
    method: 'POST',
    path: '/api/tepache-hardware-inputs', // create
    handler: async (request, h) => {
      return h.response('Not implemented').code(501);
    },
  });

  server.route({
    method: 'POST',
    path: '/api/tepache-logs', // create
    handler: async (request, h) => {
      return h.response('Not implemented').code(501);
    },
  });

  server.route({
    method: 'POST',
    path: '/api/socket/tepache-session-captures', // create
    ...sessionCapturesPostHandler(
      sessionCapturesResource,
      gameSessionsResource,
      playerSessionsResource,
      gameFacade,
      logsResource
    ),
  });

  server.route({
    method: 'POST',
    path: '/api/sms/tepache-session-captures', // create
    ...sessionCapturesTwilioSMSHandler(
      sessionCapturesResource,
      gameSessionsResource,
      playerSessionsResource,
      gameFacade
    ),
  });

  server.route({
    method: 'GET',
    path: '/api/ping', // create
    handler: (request, h) => {
      return h.response('pong').code(200);
    },
  });

  server.route({
    method: '*',
    path: '/{any*}',
    handler: function (request, h) {
      return h.response('Not Found\n').code(404);
    },
  });

  gameFacade.subscribe();

  await server.start();

  console.log('Tepache API running at', PORT);
})();

process.on('unhandledRejection', (err) => {
  console.log(err);
  try {
    gameFacade.unsubscribe();
  } catch (e) {
    console.log('Failed to unsubscribe', e);
  }
  process.exit(1);
});
