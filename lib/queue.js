import axios from 'axios';
import { QUEUE_FLUSH_TIME, QUEUE_MAXIMUM } from './constants.js';

/**
 * Queue with predefined flush and internal shut off
 */
export class ClockedQueue {
  #debugMode;

  constructor(debugMode = false) {
    this.active = false;
    this.properQueue = [];
    this.#debugMode = debugMode;
  }

  /**
   * Call to start up if possible
   */
  run() {
    const queueFlushTime = this.#debugMode ? 1 : QUEUE_FLUSH_TIME;

    if (!this.active) {
      if (this.properQueue.length) {
        this.flush();
      }

      let run = setInterval(() => {
        // If there are actual events, keep going
        if (this.properQueue.length) {
          this.flush();
        } else {
          // Tear self down
          clearInterval(run);
          run = null;
          this.active = false;
        }
      }, queueFlushTime); // in ms
      this.active = true;
    }
  }

  /**
   * Push into queue with self-destruction when approaching limit
   *
   * @param {Object} message
   * @param {String} message.pin Any matching pin for machine
   * @param {String} message.direction down or up
   */
  push(message) {
    if (this.properQueue.length >= QUEUE_MAXIMUM) {
      console.error('Queue overflowing');
      this.properQueue = [];
    }

    this.properQueue.push(message);
  }

  /**
   * Flush one action out
   */
  flush() {
    const { pin, direction } = this.properQueue.shift();
    console.info(`Sending ${direction} signal to pin ${pin}`);
    axios
      .get(`http://localhost:8000/api/${direction}/${pin}`)
      .catch((error) => {
        console.error(error);
      });
  }
}
