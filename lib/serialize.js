import decamelize from 'decamelize';

function hyphenate(str) {
  return decamelize(str, { separator: '-' });
}

/**
 * Serialize a Firestore document snapshot to a JSON:API resource objects
 * Assumes a depth of 1 for paths
 *
 * @param {DocumentSnapshot} documentSnapshot
 * @returns {Object}
 */
function _serialize(documentSnapshot) {
  const data = documentSnapshot.data();
  const id = documentSnapshot.id;
  const parentPath = documentSnapshot.ref?.parent?.path;

  return {
    type: hyphenate(parentPath),
    id,
    attributes: data,
  };
}

/**
 * Serialize a Firestore document snapshot to a JSON:API object
 *
 * @param {DocumentSnapshot} documentSnapshot
 * @param {String} self - the path to the resource
 * @returns {Object}
 **/
export function serialize(documentSnapshot, self) {
  return {
    data: _serialize(documentSnapshot),
    links: {
      self,
    },
  };
}

/**
 * Serialize an array of Firestore document snapshots to a JSON:API object
 *
 * @param {QuerySnapshot} querySnapshot - the query snapshot
 * @param {String} self - the path to the resource
 * @returns {Object}
 **/
export function serializeArray(querySnapshot, self) {
  const data = [];
  const serialized = {
    data,
    links: {
      self,
    },
  };

  querySnapshot.forEach((documentSnapshot) => {
    data.push(_serialize(documentSnapshot));
  });

  return serialized;
}

/**
 * Serialize a JSON:API object for no results
 * @param {String} self - the path to the resource
 * @returns {Object}
 */
export function serializeEmpty(self) {
  return {
    links: {
      self: self,
    },
    data: [],
  };
}
