import { getAuth } from 'firebase-admin/auth';
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

        // Will already determine if the specified game session is active or not
        const gameSessionRequest = tepacheGameSessions
          .findActiveByUrn(gameSessionUrn)
          .get();

        // Find matching active player session
        const playerSessionRequest = tepachePlayerSessions
          .findActiveByUrn(playerSessionUrn)
          .get();

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

        const sessionCaptureSnapshot =
          await tepacheSessionCaptures.createForSessions(
            gameSession,
            playerSession,
            {
              button,
              type: BUTTON_INTERACTIONS.BUTTON_PRESS,
            }
          );

        const sessionCapture = await sessionCaptureSnapshot.get();

        gameFacade.press(sessionCapture.data(), gameSession, playerSession);

        return h.response('OK').code(200);
      },
      plugins: {
        'hapi-rate-limit': {
          enabled: true,
          pathLimit: 200,
          userLimit: 6,
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
