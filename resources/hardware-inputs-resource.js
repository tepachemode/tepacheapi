import { Timestamp } from 'firebase-admin/firestore';
import { assert } from '../lib/assert.js';
import { Resource } from '../lib/resource.js';
import { buttonInteraction as validateButtonInteraction } from '../lib/validate.js';

export class HardwareInputsResource extends Resource {
  #firestore;

  namespace = 'tepache-hardware-input';

  collectionName = 'tepacheHardwareInputs';

  constructor(firestore) {
    super();

    this.#firestore = firestore;
  }

  /**
   *
   * @param {DocumentSnapshot} game - Game snapshot
   * @param {String} name - The name of the game session
   * @param {String} description - The description of the game session
   * @param {Date} expiresOn - The expiration date of the game session
   * @returns
   */
  async createForSessions(
    gameSessionId,
    playerSessionId = null,
    { button, type }
  ) {
    assert(gameSessionId, 'gameSessionId is required');
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
}
