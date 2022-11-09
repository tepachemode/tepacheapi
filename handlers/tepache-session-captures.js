import { BUTTON_INTERACTIONS } from '../constants/button_interactions.js';
import Twilio from 'twilio';
import {
  CONTROLLER_ONE_PIN_MAPPING,
  CONTROLLER_TWO_PIN_MAPPING,
} from '../lib/constants.js';

const {
  twiml: { MessagingResponse },
} = Twilio;

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

        tepacheSessionCaptures.createForSessions(
          gameSession.urn,
          playerSession.urn,
          {
            button,
            type: BUTTON_INTERACTIONS.BUTTON_PRESS,
          }
        );

        return h.response('OK').code(202);
      },
      plugins: {
        'hapi-rate-limit': {
          enabled: true,
          pathLimit: 200,
          userPathLimit: 6,
          userPathCache: {
            expiresIn: 1000,
          },
          pathCache: {
            expiresIn: 1000,
          },
        },
      },
    },
  };
}

export function tepacheSessionCapturesTwilioSMSHandler(
  tepacheSessionCaptures,
  tepacheGameSessions,
  tepachePlayerSessions,
  gameFacade
) {
  return {
    config: {
      id: '/api/sms/tepache-session-captures',
      handler: async (request, h) => {
        const gameSessionUrn = 'urn:tepache-game-session:1234';
        const playerSessionUrn =
          'urn:tepache-player-session:0c2add0d-637a-4af7-a5aa-17597a057457';
        const twiml = new MessagingResponse();

        let button = request.payload?.Body || '';

        button = button.toLowerCase();

        if (
          !button ||
          (!CONTROLLER_ONE_PIN_MAPPING[button] &&
            !CONTROLLER_TWO_PIN_MAPPING[button])
        ) {
          twiml.message(
            'Text must be one of the following: a, b, x, y, up, down, left, right'
          );
          return h.response(twiml.toString()).code(200).type('text/xml');
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

        tepacheSessionCaptures.createForSessions(
          gameSession.urn,
          playerSession.urn,
          {
            button,
            type: BUTTON_INTERACTIONS.BUTTON_PRESS,
          }
        );

        twiml.message(`Received your button press for ${button}`);
        return h.response(twiml.toString()).code(202).type('text/xml');
      },
      plugins: {
        'hapi-rate-limit': {
          enabled: true,
          pathLimit: 200,
          userPathLimit: 6,
          userPathCache: {
            expiresIn: 1000,
          },
          pathCache: {
            expiresIn: 1000,
          },
        },
      },
    },
  };
}
