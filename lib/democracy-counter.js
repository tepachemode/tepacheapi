import {
  VOTE_SESSION_TIME,
  VOTE_MAXIMUM,
  BUTTON_PRIORITY,
} from './constants.js';
/**
 * Handles designation of winner according to primarily count and button
 * priority in cases of ties
 *
 * Per session
 * 1. Open poll
 * 2. Tie raw input to vote
 * 3. Per external logic, call close
 * 4. Call score when ready for winner and to reset all counters
 */
export class DemocracyCounter {
  /**
   * Structure holding all votes
   *
   * @type {Object}
   */
  #session;

  /**
   *
   * @param {Boolean} debugMode
   */
  #debugMode;

  #cycleCallback;

  /**
   *
   * @param {Number} electionCycleTime
   */
  constructor(debugMode = false) {
    this.#debugMode = debugMode;
    this.#reset();
  }

  /**
   * Total votes casted in the current session
   */
  get #count() {
    return BUTTON_PRIORITY.reduce((total, button) => {
      total += this.#session[button];
    }, 0);
  }

  /**
   * Restore voting session to zero'd counts
   */
  #reset() {
    this.#session = BUTTON_PRIORITY.reduce((session, button) => {
      session[button] = 0;
      return session;
    }, {});
  }

  /**
   * Get the winner for the current session
   * The act of examining the winner alone will clear
   *
   * @return {String|null}
   */
  #score() {
    let cycleWinner = null;

    BUTTON_PRIORITY.forEach((button) => {
      if (this.#session[button] > (this.#session[cycleWinner] || 0)) {
        cycleWinner = button;
      }
    }, null);

    this.#reset();
    return cycleWinner;
  }

  /**
   * Attachs callback to cycles and starts endless election cycle with no
   * controls to stop
   *
   * @public
   * @param {function} cycleCallback Calls once per cycle when winner is known
   */
  run(cycleCallback) {
    if (typeof cycleCallback !== 'function') {
      throw new Error("cycleCallback must be type 'function'");
    }

    this.#cycleCallback = cycleCallback;

    if (!this.#debugMode) {
      setInterval(() => {
        const winner = this.#score();

        if (winner) {
          cycleCallback(winner);
        }
      }, VOTE_SESSION_TIME);
    }
  }

  /**
   * Accepts single button label as vote and drives its own close if
   * cap is exceeded
   *
   * @public
   * @param {String} button
   * @return {Boolean} Returns true if vote is not rejected
   */
  vote(button) {
    this.#session[button] += 1;

    if (this.#debugMode) {
      this.#cycleCallback(button);
    }

    if (this.#count >= VOTE_MAXIMUM) {
      return false;
    }

    return true;
  }
}
