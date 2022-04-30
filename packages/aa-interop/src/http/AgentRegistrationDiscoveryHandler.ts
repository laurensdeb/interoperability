import {HttpHandler, HttpHandlerContext, HttpHandlerResponse, UnauthorizedHttpError} from '@digita-ai/handlersjs-http';
import {getLoggerFor, Logger} from '@laurensdeb/authorization-agent-helpers';
import {Observable, throwError, from, map} from 'rxjs';
import {AgentRegistrationDiscoveryService} from '../agent/discovery/AgentRegistrationDiscoveryService';
import {constructAnchorLinkHeader} from '../util/constructLinkHeader';

/**
 * This handler is tasked with implementing the Agent
 * Registration discovery route as specified by the
 * Solid Application interoperability specification.
 *
 * It should require Solid OIDC authentication,
 * and use this to identify the authenticated client
 * and locate their relevant agent registration IRI.
 *
 * @link https://solid.github.io/data-interoperability-panel/specification/#agent-registration-discovery
 */
export class AgentRegistrationDiscoveryHander extends HttpHandler {
  private readonly logger: Logger = getLoggerFor(this);
  /**
     * @param {AgentRegistrationDiscoveryService} service
     */
  constructor(private readonly service: AgentRegistrationDiscoveryService) {
    super();
  }
  /**
     * Handles an incoming discovery request by returning the
     * Agent Registration as a Link header.
     *
     * @param {HttpHandlerContext} context
     * @return {Observable<HttpHandlerResponse>}
     */
  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    this.logger.debug(`Received Agent Registration discovery request at '${context.request.url.toString()}'`);
    if (!context.request.headers.authorization) {
      return throwError(() => new UnauthorizedHttpError('Missing "Authorization"-header in request.'));
    }
    return from(this.service.handle({
      headers: context.request.headers,
      request_uri: context.request.url.toString(),
    })).pipe(map((data) => {
      return {
        headers: {
          'content-type': 'text/plain',
          'link': constructAnchorLinkHeader(data.agent_iri,
              'http://www.w3.org/ns/solid/interop#registeredAgent',
              data.agent_registration),
        },
        status: 200,
      };
    }));
  }
}

