import { assert } from '../lib/assert.js';
import { Resource } from '../lib/resource.js';

export class AdminsResource extends Resource {
  #firestore;

  namespace = 'tepache-admin';

  collectionName = 'tepacheAdmins';

  constructor(firestore) {
    super();

    this.#firestore = firestore;
  }

  async getByUID(uid) {
    assert(uid, 'uid is required');

    return this.#firestore.getDocById(this.collectionName, uid);
  }
}
