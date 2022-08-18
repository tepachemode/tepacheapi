import { ClockedQueue } from '../lib/queue.js';
import {
  CONTROLLER_ONE_PIN_MAPPING,
  CONTROLLER_TWO_PIN_MAPPING,
  PLAYER_ACTIVE_LIFETIME,
} from '../lib/constants.js';
import { DemocracyCounter } from '../lib/democracy-counter.js';
import { BUTTON_INTERACTIONS } from '../constants/button_interactions.js';

const controllerOneCounter = new DemocracyCounter();
const controllerTwoCounter = new DemocracyCounter();
const clockedOneQueue = new ClockedQueue();
const clockedTwoQueue = new ClockedQueue();

const players = new Set();
const timerMap = {
  // name: setTimeoutInstance
};

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

/**
 * Responder for pin
 *
 * @param {Object} request
 * @param {Object} h
 * @return {Object}
 */
function insertTimedName(name) {
  if (name) {
    players.add(name);
    clearTimeout(timerMap[name]);
    timerMap[name] = setTimeout(() => {
      players.delete(name);
    }, PLAYER_ACTIVE_LIFETIME);
  }
}

class TeamRegister {
  teams = [];

  constructor(teamCount) {
    for (let i = 0; i < teamCount; i++) {
      this.teams.push([]);
    }
  }

  add(playerSessionUrn) {
    const smallestTeam = this.teams.reduce((currentTeam, team) => {
      if (!currentTeam) {
        return team;
      }

      if (team.length < currentTeam.length) {
        return team;
      }

      return currentTeam;
    });

    smallestTeam.push(playerSessionUrn);
    return smallestTeam;
  }
}

export class Game {
  #gameSession;

  #hardwareInputResource;

  #playerRegister;

  #counterRegister;

  #teamRegister;

  constructor(gameSession, hardwareInputResource) {
    this.#gameSession = gameSession;
    this.#hardwareInputResource = hardwareInputResource;
    this.#playerRegister = new Map();
    this.#counterRegister = new Map();
    this.#teamRegister = new TeamRegister(2);
    this.#counterRegister.set(
      this.#teamRegister.teams[0],
      controllerOneCounter
    );
    this.#counterRegister.set(
      this.#teamRegister.teams[1],
      controllerTwoCounter
    );
  }

  assign(playerSessionUrn) {
    const team = this.#teamRegister.add(playerSessionUrn);
    this.#playerRegister.set(playerSessionUrn, team);
  }

  press(sessionCapture, playerSession) {
    if (!this.#playerRegister.has(playerSession.urn)) {
      this.assign(playerSession.urn);
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

    // insertTimedName(name);

    const team = this.#playerRegister.get(playerSession.urn);
    const counter = this.#counterRegister.get(team);

    counter.vote(button, playerSession.urn);
  }

  start(onFlush) {
    /**
     * Initiate forever cycling of voting
     */
    controllerOneCounter.run((buttonOne, playerSessionUrn) => {
      const message = `Controller 1 pressed ${buttonOne}`.toUpperCase();

      console.info(message);

      const pin = CONTROLLER_ONE_PIN_MAPPING[buttonOne];

      pushQueue(CONTROLLER_ONE_PIN_MAPPING[buttonOne], 'down', () => {
        onFlush(
          playerSessionUrn,
          { button: buttonOne, type: BUTTON_INTERACTIONS.BUTTON_PRESS },
          {
            pin,
            direction: 'down',
          }
        );
      });

      pushQueue(pin, 'up', () => {
        onFlush(
          playerSessionUrn,
          { button: buttonOne, type: BUTTON_INTERACTIONS.BUTTON_RELEASE },
          {
            pin,
            direction: 'up',
          }
        );
      });
    });

    controllerTwoCounter.run((buttonTwo, playerSessionUrn) => {
      const message = `Controller 2 pressed ${buttonTwo}`.toUpperCase();
      console.info(message);

      const pin = CONTROLLER_TWO_PIN_MAPPING[buttonTwo];

      pushQueue(
        CONTROLLER_TWO_PIN_MAPPING[buttonTwo],
        'down',
        () => {
          onFlush(
            playerSessionUrn,
            { button: buttonTwo, type: BUTTON_INTERACTIONS.BUTTON_PRESS },
            {
              pin,
              direction: 'down',
            }
          );
        },
        true
      );

      pushQueue(
        pin,
        'up',
        () => {
          onFlush(
            playerSessionUrn,
            { button: buttonTwo, type: BUTTON_INTERACTIONS.BUTTON_RELEASE },
            {
              pin,
              direction: 'up',
            }
          );
        },
        true
      );
    });
  }
}
