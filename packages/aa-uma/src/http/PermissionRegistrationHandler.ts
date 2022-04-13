import {BadRequestHttpError, HttpHandler, HttpHandlerContext,
  HttpHandlerResponse, InternalServerError,
  UnauthorizedHttpError, UnsupportedMediaTypeHttpError} from '@digita-ai/handlersjs-http';
import {from, map, Observable, throwError} from 'rxjs';
import * as jose from 'jose';
import {TicketFactory} from '../token/TicketFactory';
import {parseModes} from '../util/modes/ModesParser';
import {isString} from '../util/StringGuard';
import {AccessMode} from '../util/modes/AccessModes';
import {isUrlString, UrlString} from '../util/UrlGuard';

/**
 * Registration for a Requesting Party (i.e. Pod Server)
 */
export class RequestingPartyRegistration {
  /**
   * Registration for a Requesting Party (i.e. Pod Server)
   *
   * @param {string} baseUri - Base URI of the Pod Service
   * @param {string} ecPublicKey - Public Key of the Pod Service
   * @param {string} ecAlgorithm - Algorithm used
   */
  constructor(public readonly baseUri: string,
      public readonly ecPublicKey: string,
     public readonly ecAlgorithm: 'ES256' | 'ES384' | 'ES512') {}
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
export class PermissionRegistrationHandler implements HttpHandler {
  /**
    * A PermissionRegistrationHandler is tasked with implementing
    * section 3.2 from the User-Managed Access (UMA) Profile of OAuth 2.0.
   * @param {string} baseUrl - Base URL of the AS.
   * @param {RequestingPartyRegistration[]} resourceServers - Pod Servers to be registered with the UMA AS
   */
  constructor(private readonly baseUrl: string, private readonly ticketFactory: TicketFactory,
    private readonly resourceServers: RequestingPartyRegistration[]) {
  }
  /**
 * Handle incoming requests for permission registration
 * @param {HttpHandlerContext} param0
 * @return {Observable<HttpHandlerResponse<PermissionRegistrationResponse>>}
 */
  handle({request}: HttpHandlerContext): Observable<HttpHandlerResponse<any>> {
    if (!request.headers.authorization) {
      return throwError(() => new UnauthorizedHttpError('Missing authorization header in request.'));
    }

    if (request.headers['content-type'] !== 'application/json') {
      return throwError(() => new UnsupportedMediaTypeHttpError(
          'Only Media Type "application/json" is supported for this route.'));
    }

    if (!request.body || !(request.body instanceof Object)) {
      return throwError(() => new BadRequestHttpError('Missing request body.'));
    }


    return from(this.processRequestingPartyRegistration(request.headers.authorization, request.body))
        .pipe(map((response) => {
          return {
            headers: {'content-type': 'application/json'},
            status: 200,
            body: response,
          };
        },
        ));
  }

  /**
   *
   * @param {string} authorizationHeader
   * @param {object} body
   * @return {Promise<PermissionRegistrationResponse>}
   */
  private async processRequestingPartyRegistration(authorizationHeader: string, body: any)
  : Promise<PermissionRegistrationResponse> {
    const resourceServer = await this.validateAuthorization(authorizationHeader);

    if (!body.scopes || !Array.isArray(body.scopes)) {
      throw new BadRequestHttpError('Missing or invalid key "scopes" in the request');
    }

    let scopes: Set<AccessMode>;

    try {
      scopes = parseModes(body.scopes);
    } catch (e) {
      throw new BadRequestHttpError(`Invalid provided scopes: ${(e as Error).message}`);
    }

    if (!body.resource_set_id || !isString(body.resource_set_id)) {
      throw new BadRequestHttpError('Missing or invalid key "resource_set_id" in the request');
    }
    const path: string = body.resource_set_id as string;

    if (!body.owner || !isUrlString(body.owner)) {
      throw new BadRequestHttpError('Missing or invalid key "owner" in the request');
    }
    const owner: UrlString = body.owner;


    let ticket;
    try {
      ticket = await this.ticketFactory.serialize({owner,
        sub: {path, pod: resourceServer.baseUri}, requested: scopes});
    } catch (e) {
      throw new InternalServerError(`Error while generating ticket: ${(e as Error).message}`);
    }
    return {ticket: ticket};
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
