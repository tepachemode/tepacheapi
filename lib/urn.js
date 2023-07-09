import { assert } from './assert.js';
import { v4 as uuidV4 } from 'uuid';

export function createForNamespace(namespace) {
  assert(namespace, 'namespace is required');

  const uuid = uuidV4();

  return `urn:${namespace}:${uuid}`;
}

export function create(namespace, uuid) {
  assert(namespace, 'namespace is required');
  assert(uuid, 'uuid is required');

  return `urn:${namespace}:${uuid}`;
}

export function parse(urn) {
  assert(urn, 'urn is required');

  const [, namespace, uuid] = urn.split(':');

  return { namespace, uuid };
}

export function isUrn(urn) {
  const parsedUrn = parse(urn);

  return parsedUrn.namespace && parsedUrn.uuid;
}
