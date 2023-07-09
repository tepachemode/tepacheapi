import Joi from 'joi';
import { getAuth } from 'firebase-admin/auth';
import { serializeArray, deserialize, serialize } from '../lib/serialize.js';
import { CORS } from '../lib/constants.js';
import { ROLES } from '../constants/roles.js';
import { parse, reduce } from '../lib/query.js';

const MAX_PLAYER_QUERY_LIMIT = 1000;

export function playerSessionsGetHandler(
  authentication,
  playerSessionsResource,
  adminsResource
) {
  return {
    handler: async (request, h) => {
      const { filter, limit } = request.query;
      const parsedFilters = filter ? parse(filter) : [];
      const reducedFilters = filter ? reduce(parsedFilters) : {};

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
        const adminSnapshot = await adminsResource.getByUID(uid);

        const admin = await adminSnapshot.get();
        if (
          [ROLES.OWNER, ROLES.MODERATOR, ROLES.VIEWER].includes(
            admin?.data()?.role
          )
        ) {
          const playerSessionsSnapshot = await playerSessionsResource
            .findDocs(...parsedFilters)
            .limit(Number(limit || MAX_PLAYER_QUERY_LIMIT));

          const playerSessions = await playerSessionsSnapshot.get();

          const response = serializeArray(playerSessions, request.url);

          return h
            .response(response)
            .header('Content-Type', 'application/vnd.api+json')
            .code(200);
        } else if (reducedFilters.uid) {
          const playerSessionsSnapshot = await playerSessionsResource
            .findDocs(...parsedFilters)
            .limit(Number(limit))
            .get();

          const response = serializeArray(playerSessionsSnapshot, request.url);

          return h
            .response(response)
            .header('Content-Type', 'application/vnd.api+json')
            .code(200);
        } else {
          return h.response('Forbidden').code(403);
        }
      } catch (error) {
        return h.response('Server error').code(500);
      }
    },
    options: {
      cors: CORS,
      validate: {
        query: Joi.object({
          filter: Joi.string(),
          limit: Joi.string(),
          sort: Joi.string(),
        }),
      },
    },
  };
}

export function playerSessionsFindHandler(
  authentication,
  playerSessionsResource
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
        const querySnapshot = await playerSessionsResource
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

export function playerSessionsPostHandler(
  authentication,
  playerSessionsResource,
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
          await playerSessionsResource.createForGameSessionAndUser(
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

export function playerSessionsPatchHandler(
  authentication,
  playerSessionsResource,
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
        await getAuth().verifyIdToken(authorization, checkRevoked);

        const documentReference = await playerSessionsResource.update(
          playerSessionDocumentId,
          { name }
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
