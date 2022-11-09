import { getAuth } from 'firebase-admin/auth';
import { deserialize } from '../lib/serialize.js';
import { CORS } from '../lib/config.js';

export function heartbeatHandler(authentication, tepachePlayerSessions) {
  return {
    handler: async (request, h) => {
      let { playerSessionDocumentId } = request.payload;

      try {
        await tepachePlayerSessions.update(playerSessionDocumentId);

        const recentlyActivePlayersReference =
          await tepachePlayerSessions.findRecentlyActive();

        const recentlyActivePlayersSnapshot =
          await recentlyActivePlayersReference.get();

        return h
          .response({
            recentlyActivePlayerCount: recentlyActivePlayersSnapshot.size,
          })
          .header('Content-Type', 'application/vnd.api+json')
          .code(200);
      } catch (error) {
        return h.response('Server error').code(500);
      }
    },
    options: {
      cors: CORS,
    },
  };
}
