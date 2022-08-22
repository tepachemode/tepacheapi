import { BUTTON_INTERACTIONS } from '../constants/button_interactions.js';
export function tepacheSessionCapturesPostHandler(
  tepacheSessionCaptures,
  tepacheGameSessions,
  tepachePlayerSessions,
  gameFacade
) {
  return {
    config: {
      id: '/api/socket/tepache-session-captures',
      handler: async (request, h) => {
        const button = request.payload.button;
        const gameSessionUrn = request.payload.gameSessionUrn;
        const playerSessionUrn = request.payload.playerSessionUrn;

        if (!gameSessionUrn) {
          return h.response('No game session URN').code(400);
        }

        if (!playerSessionUrn) {
          return h.response('No player session URN').code(400);
        }

        if (!button) {
          return h.response('No button').code(400);
        }

        const timerStart = Date.now();
        // Will already determine if the specified game session is active or not
        const gameSessionRequest = tepacheGameSessions
          .findActiveByUrn(gameSessionUrn)
          .get();

        console.debug(
          (Date.now() - timerStart) / 1000,
          'seconds to find game session'
        );

        // Find matching active player session
        const playerSessionRequest = tepachePlayerSessions
          .findActiveByUrn(playerSessionUrn)
          .get();

        console.debug(
          (Date.now() - timerStart) / 1000,
          'seconds to find player session'
        );

        const gameSessionQuerySnapshot = await gameSessionRequest;
        const playerSessionQuerySnapshot = await playerSessionRequest;

        // No active player session found by game session for the current user
        if (playerSessionQuerySnapshot.empty) {
          return h.response('Unauthorized').code(401);
        }

        // No active game session found per URN so reject
        if (gameSessionQuerySnapshot.empty) {
          return h.response('Unauthorized').code(401);
        }

        const gameSession = gameSessionQuerySnapshot.docs[0].data();
        const playerSession = playerSessionQuerySnapshot.docs[0].data();

        gameFacade.press(
          {
            gameSessionUrn: gameSession.urn,
            playerSessionUrn: playerSession.urn,
            button,
            type: BUTTON_INTERACTIONS.BUTTON_PRESS,
          },
          gameSession,
          playerSession
        );

        const sessionCaptureSnapshot =
          await tepacheSessionCaptures.createForSessions(
            gameSession.urn,
            playerSession.urn,
            {
              button,
              type: BUTTON_INTERACTIONS.BUTTON_PRESS,
            }
          );

        console.debug(
          (Date.now() - timerStart) / 1000,
          'seconds to create session capture'
        );

        await sessionCaptureSnapshot.get();

        console.debug(
          (Date.now() - timerStart) / 1000,
          'seconds to get session capture'
        );

        return h.response('OK').code(200);
      },
      plugins: {
        'hapi-rate-limit': {
          enabled: true,
          pathLimit: 200,
          userPathLimit: 4,
          userPathCache: {
            expiresIn: 1000,
          },
          pathCache: {
            expiresIn: 1000,
          },
          userCache: {
            expiresIn: 1000,
          },
        },
      },
    },
  };
}
