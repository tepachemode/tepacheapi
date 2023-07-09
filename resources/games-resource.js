import { assert } from '../lib/assert.js';
import { Resource } from '../lib/resource.js';
import { urn as validateUrn } from '../lib/validate.js';

export class GamesResource extends Resource {
  #firestore;

  namespace = 'tepache-game';
  collectionName = 'tepacheGames';

  constructor(firestore) {
    super();

    this.#firestore = firestore;
  }

  /**
   * Create a new game.
   *
   * @param {String} title
   * @param {String} description
   * @param {Array[String]} playModes
   * @param {Boolean} active
   *
   * @returns {Promise<DocumentReference>}
   */
  findByUrn(urn) {
    assert(validateUrn(urn), 'urn is required to be a valid urn');

    return this.#firestore
      .findDocs(this.collectionName, {
        field: 'urn',
        operator: '==',
        value: urn,
      })
      .limit(1);
  }
}
