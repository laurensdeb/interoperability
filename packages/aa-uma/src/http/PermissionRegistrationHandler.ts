import {BadRequestHttpError, HttpHandler, HttpHandlerContext,
  HttpHandlerResponse, InternalServerError,
  UnauthorizedHttpError, UnsupportedMediaTypeHttpError} from '@digita-ai/handlersjs-http';
import {concatMap, from, Observable, throwError} from 'rxjs';
import * as jose from 'jose';
import {TicketFactory} from '../token/TicketFactory';
import {parseModes} from '../util/modes/ModesParser';
import {isString} from '../util/StringGuard';
import {v4} from 'uuid';
import {AccessMode} from '../util/modes/AccessModes';

// TODO: move this to a Service
export interface RequestingPartyRegistration {
    baseUri: string;
    /**
     * PEM encoded public key
     */
    ecPublicKey: string;
    /**
     * EC Algorithm
     */
    ecAlgorithm: 'ES256' | 'ES384' | 'ES512';
}

export type PermissionRegistrationResponse = {
    ticket: string
}

/**
 * A PermissionRegistrationHandler is tasked with implementing
 * section 3.2 from the User-Managed Access (UMA) Profile of OAuth 2.0.
 *
 * It provides an endpoint to a Resource Server for requesting UMA tickets.
 */
export class PermissionRegistrationHandler extends HttpHandler {
  /**
    * A PermissionRegistrationHandler is tasked with implementing
    * section 3.2 from the User-Managed Access (UMA) Profile of OAuth 2.0.
   * @param {string} baseUrl - Base URL of the AS.
   * @param {RequestingPartyRegistration[]} resourceServers - Pod Servers to be registered with the UMA AS
   */
  constructor(private readonly baseUrl: string, private readonly ticketFactory: TicketFactory,
    private readonly resourceServers: RequestingPartyRegistration[]) {
    super();
  }
  /**
 * Handle incoming requests for permission registration
 * @param {HttpHandlerContext} param0
 * @return {Observable<HttpHandlerResponse<PermissionRegistrationResponse>>}
 */
  handle({request}: HttpHandlerContext): Observable<HttpHandlerResponse<PermissionRegistrationResponse>> {
    if (!request.headers.authorization) {
      return throwError(() => new UnauthorizedHttpError('Missing authorization header in request.'));
    }
    const resourceServer = from(this.validateAuthorization(request.headers.authorization));

    if (request.headers['content-type'] !== 'application/json') {
      return throwError(() => new UnsupportedMediaTypeHttpError(
          'Only Media Type "application/json" is supported for this route.'));
    }

    if (!request.body || !(request.body instanceof Object)) {
      return throwError(() => new BadRequestHttpError('Missing request body.'));
    }

    if (!request.body.scopes || !Array.isArray(request.body.scopes)) {
      return throwError(() => new BadRequestHttpError('Missing or invalid key "scopes" in the request'));
    }

    let scopes: Set<AccessMode>;

    try {
      scopes = parseModes(request.body.scopes);
    } catch (e) {
      return throwError(() => new BadRequestHttpError(`Invalid provided scopes: ${(e as Error).message}`));
    }

    if (!request.body.resource_set_id || !isString(request.body.resource_set_id)) {
      return throwError(() => new BadRequestHttpError('Missing or invalid key "resource_set_id" in the request'));
    }
    const path: string = request.body.resource_set_id as string;

    return resourceServer.pipe(
        concatMap(async (resourceServer: RequestingPartyRegistration) => {
          let ticket;
          try {
            ticket = await this.ticketFactory.serialize({id: v4(),
              sub: {path, pod: resourceServer.baseUri}, requested: scopes});
          } catch (e) {
            throw new InternalServerError(`Error while generating ticket: ${(e as Error).message}`);
          }

          return {
            headers: {'content-type': 'application/json'},
            status: 200,
            body: {ticket: ticket},
          };
        }),
    );
  }

  /**
   * Validates authorization header in request.
   *
   * @param {string} authorization - Authorization header value
   */
  private async validateAuthorization(authorization: string): Promise<RequestingPartyRegistration> {
    if (!/^Bearer /ui.test(authorization)) {
      throw new BadRequestHttpError('Expected Bearer authorization header.');
    }
    // TODO: prevent replay.

    const jwt = authorization.replace('Bearer ', '');

    for (const resourceServer of this.resourceServers) {
      const publicKey = await jose.importSPKI(resourceServer.ecPublicKey, resourceServer.ecAlgorithm);
      try {
        await jose.jwtVerify(jwt, publicKey, {
          audience: this.baseUrl,
        });
        return resourceServer;
      } catch (e) {
      // ignored
      }
    }
    throw new UnauthorizedHttpError('Bearer token is invalid.');
  }
}
