import {BadRequestHttpError, HttpHandlerContext, UnauthorizedHttpError} from '@digita-ai/handlersjs-http';
import {AccessMode} from '../util/modes/AccessModes';
import {ResourceIdentifier} from '../util/ResourceIdentifier';
import {Authorizer} from './authz/Authorizer';
import {ClaimTokenProcessor, ClaimTokenRequest} from './authn/ClaimTokenProcessor';
import {Ticket, TicketFactory} from './TicketFactory';
import {TokenFactory} from './TokenFactory';
import {GrantTypeProcessor, TokenResponse} from './GrantTypeProcessor';

/**
 * A UmaAccessToken is a type of RPT that is supported by the UmaGrantProcessor.
 */
export interface Authorization {
    /**
     * Authorized ACL access modes.
     */
    modes: Set<AccessMode>,
    /**
     * Resource which is the subject of the authorization request.
     */
    sub: ResourceIdentifier
}

/**
 * The Principal object serializes the authorization
 * request made by the client to the UMA AS.
 */
export interface Principal {
    /**
     * The WebID of the RP
     */
    webId: string,
    /**
     * The ClientID of the Application used by the RP
     */
    clientId?: string,
}

export type AccessToken = Principal & Authorization;


/**
 * A concrete Grant Processor for the 'urn:ietf:params:oauth:grant-type:uma-ticket' grant
 * type.
 */
export class UmaGrantProcessor extends GrantTypeProcessor {
  /**
     * Construct a new UmaGrantProcessor
     * @param {ClaimTokenProcessor[]} claimTokenProcessors - a list of registered processors for claim tokens.
     */
  public constructor(private claimTokenProcessors: ClaimTokenProcessor[],
     private authorizers: Authorizer[],
     private ticketFactory: TicketFactory,
     private tokenFactory: TokenFactory) {
    super();
  }
  /**
     * Get Supported Grant Type URI
     * @return {string} Supported grant type URI
     */
  public getSupportedGrantType(): string {
    return 'urn:ietf:params:oauth:grant-type:uma-ticket';
  }

  /**
     * Performs UMA grant processing on the form request body
     * with the given context and returns a TokenResponse for
     * the request.
     *
     * @param {TokenRequest} body - request body
     * @param {HttpHandlerContext} context - request context
     * @return {Promise<TokenResponse>} tokens - yielded tokens
     */
  public async process(body: Map<string, string>, context: HttpHandlerContext): Promise<TokenResponse> {
    // Validate if all required parameters are present in body
    if (!body.has('ticket') || !body.has('claim_token') || !body.has('claim_token_format')) {
      throw new BadRequestHttpError('The request is missing one of the required body parameters:'+
      ' {\'ticket\', \'claim_token\', \'claim_token_format\'}');
    }

    const request: ClaimTokenRequest = {claim_token: body.get('claim_token')!,
      claim_token_format: body.get('claim_token_format')!,
      url: context.request.url,
      method: context.request.method};

    if (context.request.headers['dpop']) {
      request.dpop = context.request.headers['dpop'];
    }

    if (body.has('rpt')) {
      request.rpt = body.get('rpt');
    }


    // Construct principal object
    const principal = await this.authenticate(request);

    // Extract metadata from ticket
    const ticket = await this.ticketFactory.deserialize(body.get('ticket')!);

    // Authorize request using principal
    const authorization = await this.authorize(ticket, principal);

    if (!authorization.modes.size) {
      throw new UnauthorizedHttpError('Unable to authorize request.');
    }

    // Serialize Authorization into Access Token
    const {token, tokenType} = await this.tokenFactory.serialize({...principal, ...authorization});

    return {access_token: token, token_type: tokenType};
  }

  /**
   * Authenticates a claim token request,
   * returning the authenticated Principal
   * object or throwing an error if the token
   * request could not be authenticated.
   *
   * @param {ClaimTokenRequest} req - request
   * @return {Promise<Principal>} - authenticated principal
   */
  private async authenticate(req: ClaimTokenRequest): Promise<Principal> {
    for (const processor of this.claimTokenProcessors) {
      const principal = await processor.process(req);
      if (principal) {
        return principal;
      }
    }
    throw new BadRequestHttpError('Unsupported token request.');
  }

  /**
   * Authorize a new request based on ticket and principal.
   *
   * @param {Ticket} ticket - requested resource and modes
   * @param {Principal} principal - authenticated client
   * @return {Promise<Authorization>} - authorization decision
   */
  private async authorize(ticket: Ticket, principal: Principal): Promise<Authorization> {
    const modes = new Set<AccessMode>();
    for (const authorizer of this.authorizers) {
      [...(await authorizer.authorize(principal, ticket))]
          .filter((mode) => ticket.requested.has(mode))
          .forEach((mode) => modes.add(mode));
    }
    return {modes, sub: ticket.sub};
  }
}
