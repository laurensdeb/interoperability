import {HttpHandler, HttpHandlerContext, HttpHandlerResponse} from '@digita-ai/handlersjs-http';
import {Observable, from} from 'rxjs';
import {map} from 'rxjs/operators';
import {getLoggerFor, Logger} from '../logging/LoggerUtils';
import {JwksKeyHolder} from '../secrets/JwksKeyHolder';

/**
 * An HttpHandler used for returning the configuration
 * of the UMA Authorization Service.
 */
export class JwksRequestHandler implements HttpHandler {
  protected readonly logger: Logger = getLoggerFor(this);

  /**
   * Yields a new request handler for JWKS
   * @param {JwksKeyHolder} keyholder - the keyholder to be used for serving JWKS
   */
  public constructor(private readonly keyholder: JwksKeyHolder) {
    this.keyholder = keyholder;
  }

  /**
     * Returns the JSON Web KeySet for specified keyholder
     * @param {HttpHandlerContext} context - an irrelevant incoming context
     * @return {Observable<HttpHandlerResponse>} - the JWKS response
     */
  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    this.logger.info(`Received JWKS request at '${context.request.url}'`);
    return from(this.keyholder.getJwks()).pipe(map((data) => {
      return {body: JSON.stringify(data), headers: {'content-type': 'application/json'}, status: 200};
    }));
  }
}
