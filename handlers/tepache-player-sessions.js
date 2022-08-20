import Joi from 'joi';
import { getAuth } from 'firebase-admin/auth';
import { serializeArray, deserialize, serialize } from '../lib/serialize.js';
import { CORS } from '../lib/config.js';

export function tepachePlayerSessionsGetHandler(
  authentication,
  tepachePlayerSessions
) {
  return {
    handler: async (request, h) => {
      const { gameSessionUrn } = request.query;
      const { authorization } = request.headers;
      const checkRevoked = true;

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
          .code(401);
      }

      try {
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
      cors: CORS,
      validate: {
        query: Joi.object({
          gameSessionUrn: Joi.string().required(),
        }),
      },
    },
  };
}

export function tepachePlayerSessionsPostHandler(
  authentication,
  tepachePlayerSessions,
  generateAnonymous,
  tepacheLogs
) {
  return {
    handler: async (request, h) => {
      const deserialized = deserialize(request.payload);
      const { gameSessionUrn } = deserialized;
      let { name } = deserialized;

      const { authorization } = request.headers;
      const checkRevoked = true;

      if (!name) {
        name = generateAnonymous();
      }

      try {
        const { uid } = await getAuth().verifyIdToken(
          authorization,
          checkRevoked
        );

        const documentReference =
          await tepachePlayerSessions.createForGameSessionAndUser(
            gameSessionUrn,
            uid,
            { name }
          );

        const documentSnapshot = await documentReference.get();
        const response = serialize(documentSnapshot, request.url);

        tepacheLogs.create(`Player ${name} joined`, gameSessionUrn);

        return h
          .response(response)
          .header('Content-Type', 'application/vnd.api+json')
          .code(200);
      } catch (error) {
        return h.response('Server error').code(500);
      }
    },
    options: {
      cors: CORS,
      validate: {
        payload: Joi.object({
          data: Joi.object({
            attributes: Joi.object({}),
            type: Joi.string().required(),
          }),
        }),
        options: {
          allowUnknown: true,
        },
      },
    },
  };
}

export function tepachePlayerSessionsPatchHandler(
  authentication,
  tepachePlayerSessions,
  generateAnonymous
) {
  return {
    handler: async (request, h) => {
      const { playerSessionDocumentId } = request.params;
      let { name } = deserialize(request.payload);
      const { authorization } = request.headers;
      const checkRevoked = true;

      if (!name) {
        name = generateAnonymous();
      }

      try {
        const { uid } = await getAuth().verifyIdToken(
          authorization,
          checkRevoked
        );

        const documentReference = await tepachePlayerSessions.updateName(
          playerSessionDocumentId,
          name
        );

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
      cors: CORS,
      validate: {
        payload: Joi.object({
          data: Joi.object({
            attributes: Joi.object({}),
            type: Joi.string().required(),
          }),
        }),
        options: {
          allowUnknown: true,
        },
      },
    },
  };
}
