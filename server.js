/**
 * TODO: Delete this entrypoint following clean up of index.js
 */

import Hapi from '@hapi/hapi';
import hapiPino from 'hapi-pino';
import { tepacheGameSessionsPostHandler } from './handlers/tepache-game-sessions.js';
import {
  tepachePlayerSessionsGetHandler,
  tepachePlayerSessionsPostHandler,
  tepachePlayerSessionsPatchHandler,
} from './handlers/tepache-player-sessions.js';
import { TepacheGameSessions } from './resources/game-sessions.js';
import { TepacheGames } from './resources/games.js';
import { TepachePlayerSessions } from './resources/player-sessions.js';
import { Authentication } from './services/authentication.js';
import { Firebase } from './services/firebase.js';
import { Firestore } from './services/firestore.js';
import { CORS } from './lib/config.js';

const firebase = new Firebase();

await firebase.register();

const firestore = new Firestore(firebase);
const authentication = new Authentication(firebase);

const tepachePlayerSessions = new TepachePlayerSessions(firestore);
const tepacheGameSessions = new TepacheGameSessions(firestore);
const tepacheGames = new TepacheGames(firestore);

const PORT = process.env.PORT || 7777;

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
      plugin: hapiPino,
      options: {
        // Redact Authorization headers, see https://getpino.io/#/docs/redaction
        redact: ['req.headers.authorization'],
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
    ...tepacheGameSessionsPostHandler(
      authentication,
      tepacheGameSessions,
      tepacheGames
    ),
  });

  server.route({
    method: 'GET',
    path: '/api/tepache-player-sessions',
    ...tepachePlayerSessionsGetHandler(authentication, tepachePlayerSessions),
  });

  server.route({
    method: 'POST',
    path: '/api/tepache-player-sessions',
    ...tepachePlayerSessionsPostHandler(authentication, tepachePlayerSessions),
  });

  server.route({
    method: 'PATCH',
    path: '/api/tepache-player-sessions/{playerSessionDocumentId}',
    ...tepachePlayerSessionsPatchHandler(authentication, tepachePlayerSessions),
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
    method: '*',
    path: '/{any*}',
    handler: function (request, h) {
      return h.response('Not Found\n').code(404);
    },
  });

  await server.start();

  console.log('Tepache API running at', PORT);
})();

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});
