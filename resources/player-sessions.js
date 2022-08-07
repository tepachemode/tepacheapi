import { Timestamp } from 'firebase-admin/firestore';
import { assert } from '../lib/assert.js';
import { Resource } from '../lib/resource.js';
import { createForNamespace } from '../lib/urn.js';
import { urn as validateUrn } from '../lib/validate.js';

export class TepachePlayerSessions extends Resource {
  #firestore;

  namespace = 'tepache-player-session';

  collectionName = 'tepachePlayerSessions';

  constructor(firestore) {
    super();

    this.#firestore = firestore;
  }

  /**
   * Find matching player session for game session.
   *
   * @param {String} gameSessionUrn - The urn of the game session.
   * @param {Object} options
   * @param {String} uid - The uid of the player.
   *
   * @returns {Promise<DocumentReference>}
   */
  getByGameSessionUrnAndUser(gameSessionUrn, uid) {
    assert(
      validateUrn(gameSessionUrn),
      'gameSessionUrn is required to be a valid urn'
    );
    assert(uid, 'uid is required');

    return this.#firestore
      .findDocs(
        this.collectionName,
        {
          field: 'gameSessionUrn',
          operator: '==',
          value: gameSessionUrn,
        },
        {
          field: 'uid',
          operator: '==',
          value: uid,
        }
      )
      .orderBy('createdAt')
      .limitToLast(1);
  }

  createByGameSessionAndUser(gameSessionUrn, uid) {
    assert(
      validateUrn(gameSessionUrn),
      'gameSessionUrn is required to be a valid urn'
    );
    assert(uid, 'uid is required');

    const urn = createForNamespace(this.namespace);
    const createdAt = Timestamp.now();

    const document = {
      urn,
      createdAt,
      lastActivityAt: createdAt,
      gameSessionUrn,
      uid,
    };

    return this.#firestore.addDoc(this.collectionName, document);
  }
}
