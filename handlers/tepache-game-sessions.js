import Joi from 'joi';
import { getAuth } from 'firebase-admin/auth';
import { serialize } from '../lib/serialize.js';

export function tepacheGameSessionsPostHandler(
  authentication,
  tepacheGameSessions,
  tepacheGames
) {
  return {
    handler: async (request, h) => {
      const { name, description, gameUrn, expiresOn } = request.payload;
      const { authorization } = request.headers;
      const checkRevoked = true;

      try {
        // const { uid } = await getAuth().verifyIdToken(
        //   authorization,
        //   checkRevoked
        // );

        // await getAuth().setCustomUserClaims(uid, { admin: true }); // Delete

        // Find matching game to seed the game session
        const games = await tepacheGames.findByUrn(gameUrn).get();

        if (games.empty) {
          return h
            .response({
              error: 'Game not found',
            })
            .code(404);
        }

        const game = games.docs[0].data();

        const documentReference = await tepacheGameSessions.createByGame(game, {
          name,
          description,
          expiresOn,
        });

        const documentSnapshot = await documentReference.get();
        const response = serialize(documentSnapshot, request.url);

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
        payload: Joi.object({
          name: Joi.string().required(),
          description: Joi.string().required(),
          gameUrn: Joi.string().required(),
          expiresOn: Joi.date(),
        }),
      },
    },
  };
}
