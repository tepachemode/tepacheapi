const Hapi = require('@hapi/hapi');
const axios = require('axios');
const HapiRateLimit = require('hapi-rate-limit');

const players = new Set();
const timerMap = {
  // name: setTimeoutInstance
};

/**
 * True if good
 *
 * @param {} pin
 */
function pinValidate(pin) {
  const coerced = parseInt(pin, 10);

  if (isNaN(coerced)) {
    return false;
  }

  return true;
}

/**
 * Responder for pin
 *
 * @param {Object} request
 * @param {Object} h
 * @return {Object}
 */
function insertTimedName({state: {name}}) {
  if (name) {
    players.add(name);
    clearTimeout(timerMap[name]);
    timerMap[name] = setTimeout(() => {
      players.delete(name);
    }, 30000);
  }
}

/**
 * Responder for pin
 *
 * @param {Object} request
 * @param {Object} h
 * @return {Object}
 */
function sharedHandler(request, h, direction) {
  const pin = request.params.pin;
  if (!pinValidate(pin)) {
    return h.response('Bad request').code(400);
  }

  insertTimedName(request);

  axios
      .get(`http://localhost:8000/api/${direction}/${pin}`)
      .then((res) => {
        console.log(`statusCode: ${res.status}`);
      })
      .catch((error) => {
        console.error(error);
      });

  return {
    count: players.size,
  };
}

const init = async () => {
  const server = Hapi.server({
    port: 8001,
    host: '0.0.0.0',
  });

  await server.register({
    plugin: HapiRateLimit,
    options: {
      enabled: true,
      userLimit: 100,
      userCache: {
        expiresIn: 10000,
      },
    },
  });

  server.state('data', {
    ttl: null,
    isSecure: true,
    isHttpOnly: true,
    encoding: 'none',
    clearInvalid: true,
    strictHeader: true,
  });

  server.route({
    method: 'GET',
    path: '/api/down/{pin}',
    handler: (request, h) => {
      return sharedHandler(request, h, 'down');
    },
  });

  server.route({
    method: 'GET',
    path: '/api/up/{pin}',
    handler: (request) => {
      return sharedHandler(request, h, 'up');
    },
  });

  server.route({
    method: '*',
    path: '/{any*}',
    handler: function(request, h) {
      return h.response('Not found').code(404);
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
