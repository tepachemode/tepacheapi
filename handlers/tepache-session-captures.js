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
        const { authorization } = request.auth.credentials;
        const checkRevoked = true;

        if (!gameSessionUrn) {
          return h.response('No game session URN').code(400);
        }

        if (!button) {
          return h.response('No button').code(400);
        }

        let uid;
        try {
          const claim = await getAuth().verifyIdToken(
            authorization,
            checkRevoked
          );
          uid = claim.uid;
        } catch (error) {
          return h
            .response({
              error: 'Invalid token',
            })
            .code(403);
        }

        // Will already determine if the specified game session is active or not
        const gameSessionQuerySnapshot = await tepacheGameSessions
          .findActiveByUrn(gameSessionUrn)
          .get();

        // No active game session found per URN so reject
        if (gameSessionQuerySnapshot.empty) {
          return h.response('Unauthorized').code(401);
        }

        const gameSession = gameSessionQuerySnapshot.docs[0].data();

        // Find matching active player session
        const playerSessionQuerySnapshot = await tepachePlayerSessions
          .getActiveByGameSessionUrnAndUser(gameSession.urn, uid)
          .get();

        // No active player session found by game session for the current user
        if (playerSessionQuerySnapshot.empty) {
          return h.response('Unauthorized').code(401);
        }

        const playerSession = playerSessionQuerySnapshot.docs[0].data();

        // Non-blocking call to create session capture
        const sessionCapture = tepacheSessionCaptures.createForSessions(
          gameSession,
          playerSession,
          {
            button,
            type: BUTTON_INTERACTIONS.BUTTON_PRESS,
          }
        );

        gameFacade.press(sessionCapture, gameSession, playerSession);

        return h.response('OK').code(200);
      },
    },
  };
}
