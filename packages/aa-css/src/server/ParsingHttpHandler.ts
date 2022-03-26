import {RequestParser, OperationMetadataCollector, ResponseWriter,
  OperationHttpHandler, HttpHandler, getLoggerFor, HttpHandlerInput,
  ResponseDescription, RepresentationPreferences, Operation, assertError} from '@solid/community-server';
import {ErrorHandler} from '../http/output/error/ErrorHandler';


export interface ParsingHttpHandlerArgs {
  /**
   * Parses the incoming requests.
   */
  requestParser: RequestParser;
  /**
   * Generates generic operation metadata that is required for a response.
   */
  metadataCollector: OperationMetadataCollector;
  /**
   * Converts errors to a serializable format.
   */
  errorHandler: ErrorHandler;
  /**
   * Writes out the response of the operation.
   */
  responseWriter: ResponseWriter;
  /**
   * Handler to send the operation to.
   */
  operationHandler: OperationHttpHandler;
}

/**
 * Parses requests and sends the resulting Operation to wrapped operationHandler.
 * Errors are caught and handled by the Errorhandler.
 * In case the operationHandler returns a result it will be sent to the ResponseWriter.
 */
export class ParsingHttpHandler extends HttpHandler {
  private readonly logger = getLoggerFor(this);

  private readonly requestParser: RequestParser;
  private readonly errorHandler: ErrorHandler;
  private readonly responseWriter: ResponseWriter;
  private readonly metadataCollector: OperationMetadataCollector;
  private readonly operationHandler: OperationHttpHandler;

  /**
   * Parses requests and sends the resulting Operation to wrapped operationHandler.
   * Errors are caught and handled by the Errorhandler.
   * In case the operationHandler returns a result it will be sent to the ResponseWriter.
   * @param {ParsingHttpHandlerArgs} args
   */
  public constructor(args: ParsingHttpHandlerArgs) {
    super();
    this.requestParser = args.requestParser;
    this.errorHandler = args.errorHandler;
    this.responseWriter = args.responseWriter;
    this.metadataCollector = args.metadataCollector;
    this.operationHandler = args.operationHandler;
  }

  /**
   *
   * @param {HttpHandlerInput} param0
   */
  public async handle({request, response}: HttpHandlerInput): Promise<void> {
    let result: ResponseDescription | undefined;
    let preferences: RepresentationPreferences = {type: {'text/plain': 1}};
    let operation: Operation | undefined;

    try {
      operation = await this.requestParser.handleSafe(request);
      ({preferences} = operation);
      result = await this.operationHandler.handleSafe({operation, request, response});

      if (result?.metadata) {
        await this.metadataCollector.handleSafe({operation, metadata: result.metadata});
      }

      this.logger.verbose(`Parsed ${operation.method} operation on ${operation.target.path}`);
    } catch (error: unknown) {
      assertError(error);
      result = await this.errorHandler.handleSafe({error, request, preferences});
    }

    if (result) {
      await this.responseWriter.handleSafe({response, result});
    }
  }
}
