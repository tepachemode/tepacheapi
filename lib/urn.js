import { assert } from './assert.js';

export function create(namespace, uuid) {
  assert(uuid, 'uuid is required');
  assert(namespace, 'namespace is required');

  return `urn:${namespace}:${uuid}`;
}
