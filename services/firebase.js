const { initializeApp, cert } = await import('firebase-admin/app');
import { readFile } from 'node:fs/promises';

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
    const credentials = JSON.parse(
      await readFile('./tepache-mode-firebase-adminsdk-ek8ng-29a8a3e06c.json')
    );

    this.#app = await initializeApp({
      credential: cert(credentials),
    });

    return this.#app;
  }

  get app() {
    return this.#app;
  }
}
