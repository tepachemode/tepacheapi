import { config } from 'dotenv';

config();

export const PORT = process.env.PORT || 8484;

export const PUBNUB_SUBSCRIBE_KEY = process.env.PUBNUB_SUBSCRIBE_KEY;

export const PUBNUB_PUBLISH_KEY = process.env.PUBNUB_PUBLISH_KEY;

export const PUBNUB_USER_ID = process.env.PUBNUB_USER_ID;

export const FIREBASE_CREDENTIALS_FILE = process.env.FIREBASE_CREDENTIALS_FILE;

export const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET;
