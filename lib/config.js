export const CORS = {
  origin: ['*'],
  maxAge: 3600,
  credentials: true, // boolean - 'Access-Control-Allow-Credentials'
  additionalExposedHeaders: [
    'WWW-Authenticate',
    'Server-Authorization',
    'Accept',
  ], // an array of exposed headers - 'Access-Control-Expose-Headers',
  additionalHeaders: [
    'Accept',
    'Authorization',
    'Content-Type',
    'If-None-Match',
    'Accept-language',
    'Access-Control-Request-Method',
  ],
};
