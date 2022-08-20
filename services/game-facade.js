import { Game } from './game.js';
import axios from 'axios';

export class GameFacade {
  #gameSessionResource;

  #hardwareInputResource;

  #tepacheLogResource;

  #gameSessionRegister;

  #unsubscribeHandler;

  constructor(gameSessionResource, hardwareInputResource, tepacheLogResource) {
    this.#gameSessionResource = gameSessionResource;
    this.#hardwareInputResource = hardwareInputResource;
    this.#tepacheLogResource = tepacheLogResource;

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

    this.#gameSessionRegister.set(gameSessionUrn, game);
  }

  /**
   * Remove game from game session register
   *
   * @param {DocumentSnapshot} gameSession - The game session to remove
   * @returns {Promise<void>}
   */
  onGameRemoved(gameSession) {
    if (!this.#gameSessionRegister.has(gameSession.urn)) {
      return;
    }

    const game = this.#gameSessionRegister.get(gameSession.urn);
    game.stop();
    this.#gameSessionRegister.delete(gameSession.urn);
  }

  onGameModified(gameSession) {
    const hasGame = this.#gameSessionRegister.has(gameSession.urn);

    if (!hasGame) {
      this.onGameAdded(gameSession);
    }
  }

  subscribe() {
    this.#unsubscribeHandler = this.#gameSessionResource.onSnapshot(
      (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
          const gameSession = change.doc.data();
          const type = change.type;
          switch (type) {
            case 'added':
              this.onGameAdded(gameSession.urn, gameSession);
              break;
            case 'modified':
              this.onGameModified(gameSession.urn);
              break;
            case 'removed':
              this.onGameRemoved(gameSession.urn);
              break;
          }
        });
      }
    );
  }

  unsubscribe() {
    this.#unsubscribeHandler();
    this.#gameSessionRegister.forEach((game) => {
      game.stop();
    });
    this.#gameSessionRegister.clear();
  }

  press(sessionCapture, gameSession, playerSession) {
    const game = this.#gameSessionRegister.get(gameSession.urn);
    game.press(sessionCapture, playerSession);
  }
}
