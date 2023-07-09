import { Timestamp } from 'firebase-admin/firestore';
import { assert } from '../lib/assert.js';
import { Resource } from '../lib/resource.js';
import { buttonInteraction as validateButtonInteraction } from '../lib/validate.js';

export class SessionCapturesResource extends Resource {
  #firestore;

  namespace = 'tepache-session-capture';

  collectionName = 'tepacheSessionCaptures';

  constructor(firestore) {
    super();

    this.#firestore = firestore;
  }

  /**
   * Create a session capture for a game session and player session
   *
   * @param {String} gameSessionUrn - The URN of the game session
   * @param {String} playerSessionUrn - The URN of the player session
   * @param {String} button - The button that was pressed
   * @param {String} type - The type of button interaction
   *
   * @returns {Promise<DocumentReference>}
   */
  async createForSessions(gameSessionId, playerSessionId, { button, type }) {
    assert(gameSessionId, 'gameSession is required');
    assert(button, 'button is required');
    assert(validateButtonInteraction(type), 'type is required');

    const document = {
      gameSessionId,
      playerSessionId,
      button,
      type,
      createdAt: Timestamp.now(),
    };

    return await this.#firestore.addDoc(this.collectionName, document);
  }

  /**
   *
   */
  getDocById(id) {
    return this.#firestore.getDocById(this.collectionName, id);
  }
}
