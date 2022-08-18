import { PLAY_MODES } from '../constants/play-modes.js';
import { BUTTON_INTERACTIONS } from '../constants/button_interactions.js';
import { parse } from './urn.js';

/**
 * Validate the play modes
 *
 * @param {Array[String]} playModes
 * @returns
 */
export function playModes(playModes) {
  if (!playModes) {
    return false;
  }
  if (!Array.isArray(playModes)) {
    return false;
  }
  for (let i = 0; i < playModes.length; i++) {
    if (!PLAY_MODES[playModes[i]]) {
      return false;
    }
  }
  return true;
}

/**
 * Validate the access token
 *
 * @param {String} accessToken
 * @returns
 */
export function accessToken(accessToken) {
  if (!accessToken) {
    return false;
  }

  if (typeof accessToken !== 'string') {
    return false;
  }

  return true;
}

/**
 * Validate the urn
 *
 * @param {String} urn
 * @returns {Boolean}
 */
export function urn(urn) {
  if (!urn) {
    return false;
  }

  if (typeof urn !== 'string') {
    return false;
  }

  const { namespace, uuid } = parse(urn);

  if (!namespace) {
    return false;
  }

  if (!uuid) {
    return false;
  }

  return true;
}

export function buttonInteraction(buttonInteraction) {
  if (!buttonInteraction) {
    return false;
  }

  if (typeof buttonInteraction !== 'string') {
    return false;
  }

  if (!BUTTON_INTERACTIONS[buttonInteraction]) {
    return false;
  }

  return true;
}
