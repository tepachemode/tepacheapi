import { VOTE_MAXIMUM, BUTTON_PRIORITY } from './constants.js';
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
  constructor() {
    this.active = false;
    this.reset();
  }

  get count() {
    return BUTTON_PRIORITY.reduce((total, button) => {
      total += this.session[button];
    }, 0);
  }

  /**
   * Restore voting session to zero'd counts
   */
  reset() {
    this.session = BUTTON_PRIORITY.reduce((session, button) => {
      session[button] = 0;
      return session;
    }, {});
  }

  open() {
    this.active = true;
  }

  close() {
    this.active = false;
  }

  /**
   * Accepts single button label as vote and drives its own close if
   * cap is exceeded
   *
   * @param {String} button
   * @return {Boolean} Returns true if vote is not rejected
   */
  vote(button) {
    if (this.active) {
      this.session[button] += 1;
    }

    if (this.count >= VOTE_MAXIMUM) {
      this.close();
      return false;
    }

    return true;
  }

  /**
   * Get the winner for the current session
   * The act of examining the winner alone will clear
   *
   * @return {String|null}
   */
  score() {
    const winner = BUTTON_PRIORITY.reduce((current, button) => {
      if (this.session[button] > this.session[current]) {
        return this.session[button];
      }

      return current;
    }, null);

    this.reset();
    return winner;
  }
}
