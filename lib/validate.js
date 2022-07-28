import { PLAY_MODES } from '../constants/play-modes';

/**
 * Validate the play modes
 *
 * @param {Array[String]} playModes
 * @returns
 */
export function validatePlayModes(playModes) {
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
