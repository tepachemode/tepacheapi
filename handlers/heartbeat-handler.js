import { CORS } from '../lib/constants.js';

export function heartbeatHandler(authentication, playerSessionsResource) {
  return {
    handler: async (request, h) => {
      let { playerSessionDocumentId } = request.payload;

      try {
        await playerSessionsResource.update(playerSessionDocumentId);

        const recentlyActivePlayersReference =
          await playerSessionsResource.findRecentlyActive();

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
