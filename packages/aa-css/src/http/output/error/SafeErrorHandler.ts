import {getLoggerFor, ResponseDescription, createErrorMessage, getStatusCode,
  RepresentationMetadata, HTTP, toLiteral, XSD, guardedStreamFrom} from '@solid/community-server';
import {ErrorHandler, ErrorHandlerArgs} from './ErrorHandler';
import {ErrorMetadataCollector} from './metadata/ErrorMetadataCollector';


/**
 * Returns a simple text description of an error.
 * This class is a failsafe in case the wrapped error handler fails.
 */
export class SafeErrorHandler extends ErrorHandler {
  protected readonly logger = getLoggerFor(this);

  private readonly errorHandler: ErrorHandler;
  private readonly showStackTrace: boolean;
  private readonly metadataCollector: ErrorMetadataCollector | undefined;

  public constructor(errorHandler: ErrorHandler,
      showStackTrace = false, metadataCollector?: ErrorMetadataCollector) {
    super();
    this.errorHandler = errorHandler;
    this.showStackTrace = showStackTrace;
    this.metadataCollector = metadataCollector;
  }

  public async handle(input: ErrorHandlerArgs): Promise<ResponseDescription> {
    try {
      return await this.errorHandler.handleSafe(input);
    } catch (error: unknown) {
      this.logger.debug(`Recovering from error handler failure: ${createErrorMessage(error)}`);
    }
    const {error, request} = input;
    const statusCode = getStatusCode(error);
    const metadata = new RepresentationMetadata('text/plain');
    metadata.add(HTTP.terms.statusCodeNumber, toLiteral(statusCode, XSD.terms.integer));
    if (this.metadataCollector && request) {
      await this.metadataCollector.handleSafe({metadata, request});
    }

    const text = typeof error.stack === 'string' && this.showStackTrace ?
      `${error.stack}\n` :
      `${error.name}: ${error.message}\n`;

    return {
      statusCode,
      metadata,
      data: guardedStreamFrom(text),
    };
  }
}
