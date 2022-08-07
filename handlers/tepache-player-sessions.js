import Joi from 'joi';
import { getAuth } from 'firebase-admin/auth';
import { serializeArray } from '../lib/serialize.js';

export function tepachePlayerSessionsGetHandler(
  authentication,
  tepachePlayerSessions
) {
  return {
    handler: async (request, h) => {
      const { gameSessionUrn } = request.query;
      const { authorization } = request.headers;
      const checkRevoked = true;

      try {
        const { uid } = await getAuth().verifyIdToken(
          authorization,
          checkRevoked
        );

        const querySnapshot = await tepachePlayerSessions
          .getByGameSessionUrnAndUser(gameSessionUrn, uid)
          .get();

        const response = serializeArray(querySnapshot, request.url);

        return h
          .response(response)
          .header('Content-Type', 'application/vnd.api+json')
          .code(200);
      } catch (error) {
        return h.response('Server error').code(500);
      }
    },
    options: {
      validate: {
        query: Joi.object({
          gameSessionUrn: Joi.string().required(),
        }),
      },
    },
  };
}
