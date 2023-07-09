import { getFirestore } from 'firebase-admin/firestore';
import { assert } from '../lib/assert.js';

/**
 * Instantiates a Firestore from Firebase app.
 * @param {App} app
 */
export class Firestore {
  constructor(firebaseInstance) {
    assert(firebaseInstance.app, 'firebaseInstance must have an app');
    this.db = getFirestore(firebaseInstance.app);
  }

  /**
   * Fetch all documents from a collection.
   *
   * @param {String} collectionName
   * @returns Promise<CollectionReference>
   */
  async getDocs(collectionName) {
    const collection = this.db.collection(collectionName);
    return await collection;
  }

  /**
   * Query a collection for matching documents.
   *
   * @param {String} collectionName
   * @param {String} field
   * @param {String} operator
   * @param {*} value
   *
   * @returns Promise<Query>
   */
  findDocs(collectionName, ...args) {
    const collection = this.db.collection(collectionName);
    let query = collection;

    for (let i = 0; i < args.length; i += 1) {
      const { field, operator, value } = args[i];

      query = query.where(field, operator, value);
    }

    return query;
  }

  /**
   * Get a document from a collection.
   *
   * @param {String} collectionName
   * @param {String} docId
   *
   * @returns Promise<DocumentReference>
   */
  async getDocById(collectionName, docId) {
    const collection = this.db.collection(collectionName);
    return await collection.doc(docId);
  }

  /**
   * Get a document from a collection by urn
   *
   * @param {String} collectionName
   * @param {String} urn
   *
   * @returns Promise<DocumentReference>
   */
  async getDocByUrn(collectionName, urn) {
    const querySnapshot = await this.findDocs(collectionName, {
      field: 'urn',
      operator: '==',
      value: urn,
    })
      .limit(1)
      .get();

    return querySnapshot.docs.length && querySnapshot.docs[0].ref;
  }

  /**
   * Add a document to a collection.
   *
   * @param {String} collectionName
   * @param {Object} document
   *
   * @returns Promise<DocumentReference>
   */
  async addDoc(collectionName, document) {
    const collection = this.db.collection(collectionName);
    return await collection.add(document);
  }

  onSnapshot(collectionName, callback) {
    const collection = this.db.collection(collectionName);
    return collection.onSnapshot(callback);
  }

  /**
   * Update a document by reference
   *
   * @param {DocumentReference} documentReference
   * @param {*} document
   *
   * @returns Promise<WriteResult>
   */
  static async updateDocumentReference(documentReference, document) {
    return await documentReference.update(document);
  }

  /**
   * Delete a document by reference
   *
   * @param {DocumentReference} documentReference
   *
   * @returns Promise<WriteResult>
   */
  static async deleteDocumentReference(documentReference) {
    return await documentReference.delete();
  }

  static QUERY_SIZE_LIMIT = 1000;
}
