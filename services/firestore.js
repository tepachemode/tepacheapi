import { getFirestore } from 'firebase-admin/firestore';
import { assert } from '../lib/assert.js';

/**
 * Instantiates a Firestore from Firebase app.
 * @param {App} app
 */
export class Firestore {
  constructor(firebaseInstance) {
    assert(firebaseInstance.app, 'firebaseInstance must have an app');
    this.db = getFirestore();
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
  async findDocs(collectionName, field, operator, value) {
    const collection = this.db.collection(collectionName);
    return await collection.where(field, operator, value);
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
}