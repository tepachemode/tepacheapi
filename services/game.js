import { BUTTON_INTERACTIONS } from '../constants/button_interactions.js';
import {
  CONTROLLER_ONE_PIN_MAPPING,
  CONTROLLER_TWO_PIN_MAPPING,
  QUEUE_FLUSH_DOWN_TIME,
  QUEUE_FLUSH_UP_TIME,
} from '../lib/constants.js';
import { DemocracyCounter } from '../lib/democracy-counter.js';
import { ClockedQueue } from '../lib/queue.js';

const controllerOneCounter = new DemocracyCounter();
const controllerTwoCounter = new DemocracyCounter();
const clockedOneQueue = new ClockedQueue();
const clockedTwoQueue = new ClockedQueue();

/**
 * Push to action queue
 *
 * @param {*} pin
 * @param {*} direction
 * @param {*} player
 */
function pushQueue(pin, direction, onFlush, secondary) {
  if (secondary) {
    clockedTwoQueue.push({ pin, direction }, onFlush);
    clockedTwoQueue.run();
  } else {
    clockedOneQueue.push({ pin, direction }, onFlush);
    clockedOneQueue.run();
  }
}

/**
 * True if good
 *
 * @param {String} button
 */
function buttonValidate(button) {
  if (typeof button !== 'string') {
    return false;
  }

  return true;
}

class TeamRegister {
  teams = [];

  constructor(...teamNames) {
    for (let i = 0; i < teamNames.length; i++) {
      this.teams.push({
        name: teamNames[i],
        players: [],
      });
    }
  }

  add(playerSessionId) {
    this.teams[0].players.push(playerSessionId);
    // return smallestTeam;
    return this.teams[0];
  }
}

export class Game {
  #gameSession;

  #hardwareInputResource;

  #tepacheLogResource;

  #playerRegister;

  #counterRegister;

  #teamRegister;

  #flushDownTime = QUEUE_FLUSH_DOWN_TIME;

  constructor(gameSession, hardwareInputResource, tepacheLogResource) {
    this.#gameSession = gameSession;
    this.#hardwareInputResource = hardwareInputResource;
    this.#tepacheLogResource = tepacheLogResource;

    this.#playerRegister = new Map();
    this.#counterRegister = new Map();
    this.#teamRegister = new TeamRegister('one', 'two');
    this.#counterRegister.set(
      this.#teamRegister.teams[0],
      controllerOneCounter
    );
    this.#counterRegister.set(
      this.#teamRegister.teams[1],
      controllerTwoCounter
    );
  }

  assign(playerSessionId) {
    const team = this.#teamRegister.add(playerSessionId);
    this.#playerRegister.set(playerSessionId, team);
  }

  press(sessionCapture, playerSessionId) {
    if (!this.#playerRegister.has(playerSessionId)) {
      this.assign(playerSessionId);
    }

    const { button } = sessionCapture;

    if (
      !buttonValidate(button) &&
      !CONTROLLER_ONE_PIN_MAPPING[button] &&
      !CONTROLLER_TWO_PIN_MAPPING[button]
    ) {
      console.warn(`Invalid button ${button}`);
      return;
    }

    const team = this.#playerRegister.get(playerSessionId);
    const counter = this.#counterRegister.get(team);

    counter.vote(button, playerSessionId);
  }

  start(onFlush) {
    /**
     * Initiate forever cycling of voting
     */
    this.onFlush = onFlush;
    controllerOneCounter.run((buttonOne, playerSessionId) => {
      const pin = CONTROLLER_TWO_PIN_MAPPING[buttonOne];

      pushQueue(
        CONTROLLER_TWO_PIN_MAPPING[buttonOne],
        'down',
        () => {
          onFlush(
            playerSessionId,
            { button: buttonOne, type: BUTTON_INTERACTIONS.BUTTON_PRESS },
            {
              pin,
              direction: 'down',
            }
          );
        },
        QUEUE_FLUSH_DOWN_TIME
      );

      pushQueue(
        pin,
        'up',
        () => {
          onFlush(
            playerSessionId,
            { button: buttonOne, type: BUTTON_INTERACTIONS.BUTTON_RELEASE },
            {
              pin,
              direction: 'up',
            }
          );
        },
        QUEUE_FLUSH_UP_TIME
      );
    });
  }

  stop() {}

  enableVote() {
    this.#flushDownTime = QUEUE_FLUSH_DOWN_TIME;
    controllerOneCounter.enableVote();
  }

  disableVote() {
    this.#flushDownTime = 0;
    controllerOneCounter.disableVote();
  }
}
