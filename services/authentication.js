import { getAuth } from 'firebase-admin/auth';
import { assert } from '../lib/assert.js';

/**
 * Instantiates a Firestore from Firebase app.
 * @param {App} app
 */
export class Authentication {
  constructor(firebaseInstance) {
    assert(firebaseInstance.app, 'firebaseInstance must have an app');
    this.authInstance = getAuth(firebaseInstance.app);
  }

  async getAuth() {
    return await this.authInstance;
  }
}
