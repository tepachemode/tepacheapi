import { Game } from './game.js';
import axios from 'axios';
import { BUTTON_INTERACTIONS } from '../constants/button_interactions.js';
import { TEPACHE_METAL_ADDRESS } from '../config.js';

export class GameFacade {
  #gameSessionResource;

  #hardwareInputResource;

  #logResource;

  #playerSessionResource;

  #sessionCapturesResource;

  #pubnub;

  #recentlyActivePlayerCount = 0;

  #gameSessionRegister;

  #unsubscribeHandler;

  constructor(
    gameSessionResource,
    hardwareInputResource,
    logResource,
    playerSessionResource,
    sessionCapturesResource,
    pubnub
  ) {
    this.#gameSessionResource = gameSessionResource;
    this.#hardwareInputResource = hardwareInputResource;
    this.#logResource = logResource;
    this.#playerSessionResource = playerSessionResource;
    this.#sessionCapturesResource = sessionCapturesResource;
    this.#gameSessionRegister = new Map();
    this.#pubnub = pubnub;
  }

  /**
   *  Add game to game session register and start game
   *
   * @param {DocumentSnapshot} gameSession - The game session to add
   * @returns {Promise<void>}
   */
  onGameAdded(gameSessionId, gameSession) {
    if (this.#gameSessionRegister.has(gameSessionId)) {
      return;
    }

    const game = new Game(
      gameSession,
      this.#hardwareInputResource,
      this.#logResource
    );

    this.#gameSessionRegister.set(gameSessionId, { game });

    game.start(
      async (playerSessionId, { button, type }, { direction, pin }) => {
        // Non-blocking call to create hardware input
        this.#hardwareInputResource.createForSessions(
          gameSessionId,
          playerSessionId,
          {
            button,
            type,
          }
        );

        axios
          .get(`http://${TEPACHE_METAL_ADDRESS}/api/${direction}/${pin}`)
          .catch((error) => {
            console.error(error);
          });

        if (direction === 'down') {
          try {
            const playerSessionReference =
              await await this.#playerSessionResource.getDocById(
                playerSessionId
              );

            const playerSessionQuerySnapshot =
              await playerSessionReference.get();
            const playerSessionData = playerSessionQuerySnapshot.data();
            console.info(`${playerSessionData.name} pressed ${button}`);
            this.#pubnub.publish({
              message: `${playerSessionData.name} pressed ${button}`,
              channel: `admin.${gameSessionId}`,
              meta: {
                playerSessionId,
                button,
              },
            });
            console.debug(`Publishing to admin.${gameSessionId}`);
          } catch (error) {
            console.error('Error publishing to pubnub');
            console.error(error);
          }
        }
      }
    );

    this.#pubnub.subscribe({
      channels: [`chat.${gameSessionId}`],
    });

    this.#pubnub.addListener({
      message: async ({ message, publisher, channel }) => {
        if (!gameSessionId) {
          console.error('No game session id');
          return;
        }

        if (!channel.includes(gameSessionId)) {
          return;
        }

        if (!publisher) {
          console.error('No publisher');
          return;
        }

        if (!message) {
          console.error('No message');
          return;
        }

        const expression =
          /\b(left|right|[aAbByYxX]{1}|start|select|up|down)\b/gim;
        const extractedButtons = message.match(expression);

        if (!extractedButtons || extractedButtons.length === 0) {
          return;
        }

        const normalizedMessage = extractedButtons[0].toLowerCase();

        const timerStart = Date.now();
        // Will already determine if the specified game session is active or not
        const gameSessionReference =
          await await this.#gameSessionResource.getDocById(gameSessionId);

        console.debug(
          (Date.now() - timerStart) / 1000,
          'seconds to find game session'
        );

        // Find matching active player session
        const playerSessionReference =
          await await this.#playerSessionResource.getDocById(publisher);

        console.debug(
          (Date.now() - timerStart) / 1000,
          'seconds to find player session'
        );

        const gameSessionQuerySnapshot = await gameSessionReference.get();
        const playerSessionQuerySnapshot = await playerSessionReference.get();

        // No active player session found by game session for the current user
        if (playerSessionQuerySnapshot.empty) {
          return;
        }

        // No active game session found per ID so reject
        if (gameSessionQuerySnapshot.empty) {
          return;
        }

        const gameSession = gameSessionQuerySnapshot.data();

        this.press(
          {
            gameSessionId: gameSessionReference.id,
            playerSessionId: playerSessionReference.id,
            button: normalizedMessage,
            type: BUTTON_INTERACTIONS.BUTTON_PRESS,
          },
          gameSession,
          playerSessionQuerySnapshot.id
        );

        this.#sessionCapturesResource.createForSessions(
          gameSessionReference.id,
          playerSessionReference.id,
          {
            button: normalizedMessage,
            type: BUTTON_INTERACTIONS.BUTTON_PRESS,
          }
        );
      },
      presence: async ({ occupany }) => {
        if (occupany === 1) {
          console.debug('Enabling real-time play');
          game.disableVote();
        } else {
          game.enableVote();
        }
      },
    });
  }

  /**
   * Remove game from game session register
   *
   * @param {DocumentSnapshot} gameSession - The game session to remove
   * @returns {Promise<void>}
   */
  onGameRemoved(gameSessionId) {
    if (!this.#gameSessionRegister.has(gameSessionId)) {
      return;
    }

    const { game } = this.#gameSessionRegister.get(gameSessionId);
    game.stop();
    this.#pubnub.unsubscribe({
      channels: [`chat.${gameSessionId}`],
    });
    this.#gameSessionRegister.delete(gameSessionId);
  }

  onGameModified(gameSessionId, gameSession) {
    const hasGame = this.#gameSessionRegister.has(gameSessionId);

    if (!hasGame) {
      this.onGameAdded(gameSessionId, gameSession);
    }
  }

  subscribe() {
    const unsubscribeGameSessionListener = this.#gameSessionResource.onSnapshot(
      (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
          const gameSession = change.doc.data();
          const gameSessionId = change.doc.id;
          const type = change.type;
          switch (type) {
            case 'added':
              this.onGameAdded(gameSessionId, gameSession);
              break;
            case 'modified':
              this.onGameModified(gameSessionId, gameSession);
              break;
            case 'removed':
              this.onGameRemoved(gameSessionId);
              break;
          }
        });
      }
    );

    // TODO: Listen per game session
    const unsubscribePlayerSessionListener =
      this.#playerSessionResource.onSnapshot((querySnapshot) => {
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

  press(sessionCapture, gameSession, playerSessionId) {
    const { game } = this.#gameSessionRegister.get(
      sessionCapture.gameSessionId
    );
    game.press(
      sessionCapture,
      playerSessionId,
      this.#recentlyActivePlayerCount
    );
  }
}
