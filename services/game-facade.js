import { Game } from './game';
import axios from 'axios';

export class GameFacade {
  #gameSessionResource;

  #hardwareInputResource;

  #gameSessionRegister;

  #unsubscribeHandler;

  constructor(gameSessionResource, hardwareInputResource) {
    this.#gameSessionResource = gameSessionResource;
    this.#hardwareInputResource = hardwareInputResource;

    this.#gameSessionRegister = new Map();
  }

  /**
   *  Add game to game session register and start game
   *
   * @param {DocumentSnapshot} gameSession - The game session to add
   * @returns {Promise<void>}
   */
  onGameAdded(gameSession) {
    if (this.#gameSessionRegister.has(gameSession.id)) {
      return;
    }

    const game = new Game(gameSession, this.#hardwareInputResource);

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

    this.#gameSessionRegister.set(gameSession.id, game);
  }

  /**
   * Remove game from game session register
   *
   * @param {DocumentSnapshot} gameSession - The game session to remove
   * @returns {Promise<void>}
   */
  onGameRemoved(gameSession) {
    if (!this.#gameSessionRegister.has(gameSession.id)) {
      return;
    }

    const game = this.#gameSessionRegister.get(gameSession.id);
    game.stop();
    this.#gameSessionRegister.delete(gameSession.id);
  }

  onGameModified(gameSession) {
    const hasGame = this.#gameSessionRegister.has(gameSession.id);

    if (!hasGame) {
      this.onGameAdded(gameSession);
    }
  }

  subscribe() {
    this.#unsubscribeHandler = this.#gameSessionResource.onSnapshot(
      (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
          const gameSession = change.doc.data();
          const gameId = change.doc.id;
          const type = change.type;
          switch (type) {
            case 'added':
              this.onGameAdded(gameId, gameSession);
              break;
            case 'modified':
              this.onGameModified(gameSession);
              break;
            case 'removed':
              this.onGameRemoved(gameId);
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
    const game = this.#gameSessionRegister.get(gameSession.id);
    game.press(sessionCapture, playerSession);
  }
}
