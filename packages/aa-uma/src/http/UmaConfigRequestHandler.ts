import {HttpHandler, HttpHandlerContext, HttpHandlerResponse} from '@digita-ai/handlersjs-http';
import {Observable, of, throwError} from 'rxjs';

/**
 * An HttpHandler used for returning the configuration
 * of the UMA Authorization Service.
 */
export class UmaConfigRequestHandler extends HttpHandler {
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
   * Returns a mock response: ```
   * {
   * body: 'some mock output',
   * headers: {},
   * status: 200,
   * }
   * ```
   *
   * @param {HttpHandlerContext} context - an irrelevant incoming context
   * @return {Observable<HttpHandlerResponse>} - the mock response
   */
  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    if (context.request.method !== 'GET') {
      return of({body: '', headers: {allow: 'GET'}, status: 405});
    }

    const response: HttpHandlerResponse = {
      body: JSON.stringify({'jwks_uri': '/keys'}),
      headers: {},
      status: 200,
    };

    return of(response);
  }
}
