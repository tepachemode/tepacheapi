import { Game } from './game.js';
import axios from 'axios';

export class GameFacade {
  #gameSessionResource;

  #hardwareInputResource;

  #tepacheLogResource;

  #tepachePlayerSessionResource;

  #recentlyActivePlayerCount = 0;

  #gameSessionRegister;

  #unsubscribeHandler;

  constructor(
    gameSessionResource,
    hardwareInputResource,
    tepacheLogResource,
    tepachePlayerSessionResource
  ) {
    this.#gameSessionResource = gameSessionResource;
    this.#hardwareInputResource = hardwareInputResource;
    this.#tepacheLogResource = tepacheLogResource;
    this.#tepachePlayerSessionResource = tepachePlayerSessionResource;
    this.#gameSessionRegister = new Map();
  }

  /**
   *  Add game to game session register and start game
   *
   * @param {DocumentSnapshot} gameSession - The game session to add
   * @returns {Promise<void>}
   */
  onGameAdded(gameSessionUrn, gameSession) {
    if (this.#gameSessionRegister.has(gameSessionUrn)) {
      return;
    }

    const game = new Game(
      gameSession,
      this.#hardwareInputResource,
      this.#tepacheLogResource
    );

    game.start((playerSessionUrn, { button, type }, { direction, pin }) => {
      // Non-blocking call to create hardware input
      this.#hardwareInputResource.createForSessions(
        gameSession.urn,
        playerSessionUrn,
        {
          button,
          type,
        }
      );

      axios
        .get(`http://localhost:8000/api/${direction}/${pin}`)
        .catch((error) => {
          console.error(error);
        });
    });

    this.#gameSessionRegister.set(gameSessionUrn, { game });
  }

  /**
   * Remove game from game session register
   *
   * @param {DocumentSnapshot} gameSession - The game session to remove
   * @returns {Promise<void>}
   */
  onGameRemoved(gameSessionUrn) {
    if (!this.#gameSessionRegister.has(gameSessionUrn)) {
      return;
    }

    const { game } = this.#gameSessionRegister.get(gameSessionUrn);
    game.stop();
    this.#gameSessionRegister.delete(gameSessionUrn);
  }

  onGameModified(gameSessionUrn, gameSession) {
    const hasGame = this.#gameSessionRegister.has(gameSessionUrn);

    if (!hasGame) {
      this.onGameAdded(gameSessionUrn, gameSession);
    }
  }

  subscribe() {
    const unsubscribeGameSessionListener = this.#gameSessionResource.onSnapshot(
      (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
          const gameSession = change.doc.data();
          const type = change.type;
          switch (type) {
            case 'added':
              this.onGameAdded(gameSession.urn, gameSession);
              break;
            case 'modified':
              this.onGameModified(gameSession.urn, gameSession);
              break;
            case 'removed':
              this.onGameRemoved(gameSession.urn);
              break;
          }
        });
      }
    );

    // TODO: Listen per game session
    const unsubscribePlayerSessionListener =
      this.#tepachePlayerSessionResource.onSnapshot((querySnapshot) => {
        this.#recentlyActivePlayerCount = 0;

        querySnapshot.forEach((documentSnapshot) => {
          const lastActivityAt = documentSnapshot.get('lastActivityAt');

          if (
            lastActivityAt &&
            lastActivityAt.toMillis() >= Date.now() - 60 * 1000
          ) {
            this.#recentlyActivePlayerCount += 1;
          }
        });

        console.debug(
          'Updating active player count',
          this.#recentlyActivePlayerCount
        );
      });

    this.#unsubscribeHandler = () => {
      unsubscribePlayerSessionListener();
      unsubscribeGameSessionListener();
    };
  }

  unsubscribe() {
    this.#unsubscribeHandler();
    this.#gameSessionRegister.forEach(({ game }) => {
      game.stop();
    });
    this.#gameSessionRegister.clear();
  }

  press(sessionCapture, gameSession, playerSession) {
    const { game } = this.#gameSessionRegister.get(gameSession.urn);
    game.press(sessionCapture, playerSession, this.#recentlyActivePlayerCount);
  }
}
