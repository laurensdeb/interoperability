import {RepresentationConverterArgs, RepresentationConverter, ResponseDescription, getStatusCode,
  Representation, RepresentationMetadata, INTERNAL_ERROR, HTTP, toLiteral,
  XSD, BasicRepresentation} from '@solid/community-server';
import {ErrorHandler, ErrorHandlerArgs} from './ErrorHandler';
import {ErrorMetadataCollector} from './metadata/ErrorMetadataCollector';


  // Used by internal helper function
  type PreparedArguments = {
    statusCode: number;
    conversionArgs: RepresentationConverterArgs;
  };

/**
   * Converts an error into a Representation of content type internal/error.
   * Then feeds that representation into its converter to create a representation based on the given preferences.
   */
export class ConvertingErrorHandler extends ErrorHandler {
  private readonly converter: RepresentationConverter;
  private readonly showStackTrace: boolean;
  private readonly metadataCollector: ErrorMetadataCollector | undefined;

  /**
   * Converts an error into a Representation of content type internal/error.
   * Then feeds that representation into its converter to create a representation based on the given preferences.
   *
   * @param {RepresentationConverter} converter
   * @param {boolean} showStackTrace
   * @param {ErrorMetadataCollector} metadataCollector
   */
  public constructor(converter: RepresentationConverter,
      showStackTrace = false, metadataCollector?: ErrorMetadataCollector) {
    super();
    this.converter = converter;
    this.metadataCollector = metadataCollector;
    this.showStackTrace = showStackTrace;
  }

  /**
   * Can we handle the provided error.
   *
   * @param {ErrorHandlerArgs} input
   */
  public async canHandle(input: ErrorHandlerArgs): Promise<void> {
    const {conversionArgs} = this.prepareArguments(input);

    await this.converter.canHandle(conversionArgs);
  }

  /**
   * Handles the error and creates a response using the converter
   * @param {ErrorHandlerArgs} input
   * @return {Promise<ResponseDescription>}
   */
  public async handle(input: ErrorHandlerArgs): Promise<ResponseDescription> {
    const {statusCode, conversionArgs} = this.prepareArguments(input);

    const converted = await this.converter.handle(conversionArgs);

    return this.createResponse(statusCode, converted);
  }

  /**
   * Handles the error and creates a response using the converter
   * @param {ErrorHandlerArgs} input
   * @return {Promise<ResponseDescription>}
   */
  public async handleSafe(input: ErrorHandlerArgs): Promise<ResponseDescription> {
    const {statusCode, conversionArgs} = this.prepareArguments(input);

    const converted = await this.converter.handleSafe(conversionArgs);

    if (this.metadataCollector && input.request) {
      await this.metadataCollector.handleSafe({metadata: converted.metadata, request: input.request});
    }

    return this.createResponse(statusCode, converted);
  }

  /**
     * Prepares the arguments used by all functions.
     * @param {ErrorHandlerArgs} param0
     * @return {PreparedArguments}
     */
  private prepareArguments({error, preferences}: ErrorHandlerArgs): PreparedArguments {
    const statusCode = getStatusCode(error);
    const representation = this.toRepresentation(error, statusCode);
    const identifier = {path: representation.metadata.identifier.value};
    return {statusCode, conversionArgs: {identifier, representation, preferences}};
  }


  /**
     * Creates a ResponseDescription based on the Representation.
     * @param {number} statusCode
     * @param {Representation} converted
     * @return {ResponseDescription}
     */
  private createResponse(statusCode: number, converted: Representation): ResponseDescription {
    return {
      statusCode,
      metadata: converted.metadata,
      data: converted.data,
    };
  }

  /**
     * Creates a Representation based on the given error.
     * Content type will be internal/error.
     * The status code is used for metadata.
     * @param {Error} error
     * @param {number} statusCode
     * @return {Representation}
     */
  private toRepresentation(error: Error, statusCode: number): Representation {
    const metadata = new RepresentationMetadata(INTERNAL_ERROR);
    metadata.add(HTTP.terms.statusCodeNumber, toLiteral(statusCode, XSD.terms.integer));

    if (!this.showStackTrace) {
      delete error.stack;
    }

    return new BasicRepresentation([error], metadata, false);
  }
}
