import { Timestamp } from 'firebase-admin/firestore';
import { assert } from '../lib/assert.js';
import { Resource } from '../lib/resource.js';
import { createForNamespace } from '../lib/urn.js';
import { PLAY_MODES } from '../constants/play-modes.js';
import { GAME_SESSION_STATE } from '../constants/game-session-state.js';

const DEFAULT_PLAY_MODE = PLAY_MODES.ADMIN_CONTROL;
const DEFAULT_STATE = GAME_SESSION_STATE.PENDING;

export class TepacheGameSessions extends Resource {
  #firestore;

  namespace = 'tepache-game-session';

  collectionName = 'tepacheGameSessions';

  constructor(firestore) {
    super();

    this.#firestore = firestore;
  }

  /**
   *
   * @param {DocumentSnapshot} game - Game snapshot
   * @param {String} name - The name of the game session
   * @param {String} description - The description of the game session
   * @param {Date} expiresOn - The expiration date of the game session
   * @returns
   */
  async createByGame(game, { name, description, expiresOn }) {
    assert(game, 'game is required');
    const fallbackExpiresAt = Timestamp.fromDate(
      new Date(Date.now() + 1000 * 60 * 60 * 24)
    );

    const urn = createForNamespace(this.namespace);
    const expiresAt = fallbackExpiresAt || Timestamp.fromDate(expiresOn);

    const document = {
      urn,
      gameUrn: game.urn,
      name,
      description,
      logo: game.logo,
      state: DEFAULT_STATE,
      stateHistory: [
        {
          state: DEFAULT_STATE,
          createdAt: Timestamp.now(),
        },
      ],
      playMode: DEFAULT_PLAY_MODE,
      expiresAt,
    };

    return await this.#firestore.addDoc(this.collectionName, document);
  }
}
