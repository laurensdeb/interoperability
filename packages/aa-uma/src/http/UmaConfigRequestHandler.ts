import {HttpHandler, HttpHandlerContext, HttpHandlerResponse} from '@digita-ai/handlersjs-http';
import {Observable, of} from 'rxjs';

export interface UmaConfiguration {
  issuer?: string,
  jwks_uri?: string,
  token_endpoint?: string,
  grant_types_supported?: string[]
}

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
   * Returns UMA Configuration for the AS
   * @return {UmaConfiguration} - AS Configuration
   */
  private getUmaConfig(): UmaConfiguration {
    return {jwks_uri: '/keys', grant_types_supported: ['urn:ietf:params:oauth:grant-type:uma-ticket']};
  }

  /**
   * Returns the endpoint's UMA configuration
   *
   * @param {HttpHandlerContext} context - an irrelevant incoming context
   * @return {Observable<HttpHandlerResponse>} - the mock response
   */
  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    if (context.request.method !== 'GET') {
      return of({body: '', headers: {allow: 'GET'}, status: 405});
    }

    const response: HttpHandlerResponse = {
      body: JSON.stringify(this.getUmaConfig()),
      headers: {'content-type': 'application/json'},
      status: 200,
    };

    return of(response);
  }
}
