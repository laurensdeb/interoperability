import {HttpHandler, HttpHandlerContext, HttpHandlerResponse} from '@digita-ai/handlersjs-http';
import {Observable, of, from, throwError} from 'rxjs';
import {map} from 'rxjs/operators';
import {JwksKeyHolder} from '../secrets/JwksKeyHolder';

/**
 * An HttpHandler used for returning the configuration
 * of the UMA Authorization Service.
 */
export class JwksRequestHandler extends HttpHandler {
  /**
   * Yields a new request handler for JWKS
   * @param {JwksKeyHolder} keyholder - the keyholder to be used for serving JWKS
   */
  public constructor(private readonly keyholder: JwksKeyHolder) {
    super();
    this.keyholder = keyholder;
  }

  /**
   * Indicates this handler accepts any input.
   *
   * @param {HttpHandlerContext} context - the irrelevant incoming context
   * @return {Observable<boolean>} always `of(true)`
   */
  canHandle(context: HttpHandlerContext): Observable<boolean> {
    return of(true);
  }

  /**
     * Returns the JSON Web KeySet for specified keyholder
     * @param {HttpHandlerContext} context - an irrelevant incoming context
     * @return {Observable<HttpHandlerResponse>} - the JWKS response
     */
  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    if (context.request.method !== 'GET') {
      return of({body: '', headers: {allow: 'GET'}, status: 405});
    }
    return from(this.keyholder.getJwks()).pipe(map((data) => {
      return {body: JSON.stringify(data), headers: {}, status: 200};
    }));
  }
}
