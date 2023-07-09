import { Timestamp } from 'firebase-admin/firestore';
import { Resource } from '../lib/resource.js';

export class LogsResource extends Resource {
  #firestore;

  namespace = 'tepache-log';

  collectionName = 'tepacheLogs';

  constructor(firestore) {
    super();

    this.#firestore = firestore;
  }

  async create(message, referenceUrn) {
    const document = {
      message,
      referenceUrn,
      createdAt: Timestamp.now(),
      deleted: false,
    };

    return await this.#firestore.addDoc(this.collectionName, document);
  }
}
