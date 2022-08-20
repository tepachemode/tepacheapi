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

  constructor(...teamNames) {
    for (let i = 0; i < teamNames.length; i++) {
      this.teams.push({
        name: teamNames[i],
        players: [],
      });
    }
  }

  add(playerSessionUrn) {
    // const smallestTeam = this.teams.reduce((currentTeam, team) => {
    //   if (!currentTeam) {
    //     return team;
    //   }

    //   if (team.players.length < currentTeam.players.length) {
    //     return team;
    //   }

    //   return currentTeam;
    // });

    this.teams[0].players.push(playerSessionUrn);
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

  assign(playerSession) {
    const team = this.#teamRegister.add(playerSession.urn);
    // const message = `${playerSession.name} has joined team ${team.name}`;
    // this.#tepacheLogResource.create(message, playerSession.urn);
    this.#playerRegister.set(playerSession.urn, team);
  }

  press(sessionCapture, playerSession) {
    if (!this.#playerRegister.has(playerSession.urn)) {
      this.assign(playerSession);
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

    // const message = `${playerSession.name} voted for ${button?.toUpperCase()}`;
    // this.#tepacheLogResource.create(message, playerSession.urn);
    counter.vote(button, playerSession);
  }

  start(onFlush) {
    /**
     * Initiate forever cycling of voting
     */
    controllerOneCounter.run((buttonOne, playerSession) => {
      const pin = CONTROLLER_ONE_PIN_MAPPING[buttonOne];
      //const team = this.#playerRegister.get(playerSession.urn);
      const message = `${playerSession.name} pressed ${buttonOne}`;
      this.#tepacheLogResource.create(message, playerSession.urn);

      pushQueue(CONTROLLER_ONE_PIN_MAPPING[buttonOne], 'down', () => {
        onFlush(
          playerSession.urn,
          { button: buttonOne, type: BUTTON_INTERACTIONS.BUTTON_PRESS },
          {
            pin,
            direction: 'down',
          }
        );
      });

      pushQueue(pin, 'up', () => {
        onFlush(
          playerSession.urn,
          { button: buttonOne, type: BUTTON_INTERACTIONS.BUTTON_RELEASE },
          {
            pin,
            direction: 'up',
          }
        );
      });
    });

    // controllerTwoCounter.run((buttonTwo, playerSession) => {
    //   const pin = CONTROLLER_TWO_PIN_MAPPING[buttonTwo];

    //   // const { team } = this.#playerRegister.get(playerSession.urn);
    //   const message = `${playerSession.name} pressed ${buttonTwo}`;
    //   this.#tepacheLogResource.create(message, playerSession.urn);

    //   pushQueue(
    //     CONTROLLER_TWO_PIN_MAPPING[buttonTwo],
    //     'down',
    //     () => {
    //       onFlush(
    //         playerSession.urn,
    //         { button: buttonTwo, type: BUTTON_INTERACTIONS.BUTTON_PRESS },
    //         {
    //           pin,
    //           direction: 'down',
    //         }
    //       );
    //     },
    //     true
    //   );

    //   pushQueue(
    //     pin,
    //     'up',
    //     () => {
    //       onFlush(
    //         playerSession.urn,
    //         { button: buttonTwo, type: BUTTON_INTERACTIONS.BUTTON_RELEASE },
    //         {
    //           pin,
    //           direction: 'up',
    //         }
    //       );
    //     },
    //     true
    //   );
    // });
  }

  stop() {}
}
