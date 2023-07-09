import { QUEUE_FLUSH_DEFAULT_TIME, QUEUE_MAXIMUM } from './constants.js';

/**
 * Queue with predefined flush and internal shut off
 */
export class ClockedQueue {
  #debugMode;

  constructor({ debugMode = false } = {}) {
    this.active = false;
    this.properQueue = [];
    this.#debugMode = debugMode;
  }

  /**
   * Call to start up if possible
   */
  run() {
    const defaultFlushTime = this.#debugMode ? 1 : QUEUE_FLUSH_DEFAULT_TIME;

    if (!this.active) {
      if (this.properQueue.length) {
        this.flush();
      }

      const flushLoop = () => {
        const { flushTime = defaultFlushTime } = this.peek();
        console.debug('flush time is', flushTime);
        setTimeout(() => {
          // If there are actual events, keep going
          if (this.properQueue.length) {
            this.flush();
            flushLoop();
          } else {
            this.active = false;
          }
        }, flushTime);
      };

      flushLoop();
      this.active = true;
    }
  }

  /**
   * Push into queue with self-destruction when approaching limit
   *
   * @param {Object} message
   * @param {String} message.pin Any matching pin for machine
   * @param {String} message.direction down or up
   * @param {Function} onFlush
   * @param {Number} flushTime How long to wait before flushing
   */
  push(message, onFlush, flushTime) {
    if (this.properQueue.length >= QUEUE_MAXIMUM) {
      console.error('Queue overflowing');
      this.properQueue = [];
    }

    this.properQueue.push({ message, onFlush, flushTime });
  }

  /**
   * Flush one action out
   */
  flush() {
    const { message, onFlush } = this.properQueue.shift();
    const { pin, direction } = message;

    console.info(`Sending ${direction} signal to pin ${pin}`);
    try {
      onFlush(pin, direction);
    } catch (e) {
      console.error('Error flushing', e);
    }
  }

  peek() {
    return this.properQueue[0] || {};
  }
}
