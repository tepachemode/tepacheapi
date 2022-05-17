import axios from 'axios';
import { QUEUE_FLUSH_TIME, QUEUE_MAXIMUM } from './constants.js';

/**
 * Queue with predefined flush and internal shut off
 */
export class ClockedQueue {
  constructor() {
    this.active = false;
    this.properQueue = [];
  }

  /**
   * Call to start up if possible
   */
  run() {
    if (!this.active) {
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
      }, QUEUE_FLUSH_TIME); // in ms
      this.active = true;
    }
  }

  /**
   * Push into queue with self-destruction when approaching limit
   *
   * @param {String} pin Any matching pin for machine
   * @param {String} direction down or up
   */
  push(pin, direction) {
    if (this.properQueue.length >= QUEUE_MAXIMUM) {
      console.error('Queue overflowing');
      this.properQueue = [];
    }

    this.properQueue.push({
      pin,
      direction,
    });
  }

  /**
   * Flush one action out
   */
  flush() {
    const { pin, direction } = this.properQueue.shift();

    axios
      .get(`http://localhost:8000/api/${direction}/${pin}`)
      .then((res) => {
        console.info(`statusCode: ${res.status}`);
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
