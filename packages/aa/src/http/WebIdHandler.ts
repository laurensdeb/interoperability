import {getLoggerFor, Logger, RoutePath} from '@thundr-be/sai-helpers';
import {HttpHandler, HttpHandlerContext, HttpHandlerResponse} from '@digita-ai/handlersjs-http';
import {Observable, of} from 'rxjs';
/**
 * Default route serving WebIDs
 * that trust the static Solid OIDC IdP
 */
export class WebIdHandler extends HttpHandler {
  private readonly logger: Logger = getLoggerFor(this);
  /**
     * @param {RoutePath} oidcIssuer - Trusted OIDC Issuer
     */
  constructor(private readonly oidcIssuer: RoutePath) {
    super();
  }

  /**
   * Returns a WebID in text/turtle format
   * which trusts the OIDC Issuer.
   *
   * @param {HttpHandlerContext} input
   * @return {Observable<HttpHandlerResponse<any>>}
   */
  handle(input: HttpHandlerContext): Observable<HttpHandlerResponse<any>> {
    this.logger.debug(`Received request for WebID ${input.request.url}`);
    return of({
      status: 200,
      headers: {'content-type': 'text/turtle'},
      body: `@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix interop: <http://www.w3.org/ns/solid/interop#>.
@prefix solid: <http://www.w3.org/ns/solid/terms#>.

<${input.request.url.toString()}>
    solid:oidcIssuer <${this.oidcIssuer.getUri()}>;
    a foaf:Person.      
`,
    });
  }
}
