/**
 * TODO: Delete this entrypoint following clean up of index.js
 */

import { Firebase } from './services/firebase.js';
import { Firestore } from './services/firestore.js';
import { TepacheGames } from './resources/games';
import Hapi from '@hapi/hapi';

const firebase = new Firebase();

await firebase.register();

const firestore = new Firestore(firebase);

const tepacheGames = new TepacheGames(firestore);

const PORT = process.env.PORT || 777;

(async () => {
  const server = Hapi.server({
    port: PORT,
    host: '0.0.0.0',
  });

  server.route({
    method: 'GET',
    path: '/api/game/create',
    handler: (request, h) => {
      return 'TODO';
    },
  });

  server.route({
    method: '*',
    path: '/{any*}',
    handler: function (request, h) {
      return h.response('Not Found').code(404);
    },
  });

  await server.start();

  console.log('Tepache API running at', PORT);
})();

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});
