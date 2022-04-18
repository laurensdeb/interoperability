import {LoggerLevel, Logger as HandlerLogger} from '@digita-ai/handlersjs-logging';
import {WinstonLoggerFactory} from './WinstonLoggerFactory';

const loggerFactory = new WinstonLoggerFactory();
const loggerLevel = LoggerLevel.debug;
const loggerMinimumPrintLevel = LoggerLevel.debug;

export type Logger = HandlerLogger;

/**
 * Gets a logger instance for the given class instance.
 *
 * @param {string | { constructor: { name: string } }} loggable - A class instance or a class string name.
 * @return {Logger}
 */
export const getLoggerFor = (
    loggable: string | { constructor: { name: string } },
): Logger => {
  return loggerFactory.createLogger(typeof loggable === 'string' ? loggable : loggable.constructor.name,
      loggerLevel, loggerMinimumPrintLevel);
};
