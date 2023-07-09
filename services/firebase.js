const { initializeApp, cert } = await import('firebase-admin/app');
import { readFile } from 'node:fs/promises';
import {
  FIREBASE_CREDENTIALS_FILE,
  FIREBASE_STORAGE_BUCKET,
} from '../config.js';

/**
 * Instantiates a Firebase app.
 */
export class Firebase {
  #app = null;

  /**
   * Reads local credentials to return a Firebase app.
   *
   * @returns {Promise<App>}
   */
  async register() {
    const credentials = JSON.parse(await readFile(FIREBASE_CREDENTIALS_FILE));

    this.#app = await initializeApp({
      credential: cert(credentials),
      storageBucket: FIREBASE_STORAGE_BUCKET,
    });

    return this.#app;
  }

  get app() {
    return this.#app;
  }
}
