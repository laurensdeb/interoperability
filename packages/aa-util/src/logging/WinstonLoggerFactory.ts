/* eslint-disable require-jsdoc */
import {LoggerFactory, LoggerLevel, Logger} from '@digita-ai/handlersjs-logging';
import {WinstonLogger} from './WinstonLogger';

/**
 * Creates {@link WinstonLogger } instances for the given logging level.
 */
export class WinstonLoggerFactory implements LoggerFactory {
  createLogger(label: string, minimumLevel: LoggerLevel, minimumLevelPrintData: LoggerLevel): Logger {
    return new WinstonLogger(label, minimumLevel, minimumLevelPrintData);
  }
}
