import {BadRequestHttpError, HttpHandlerContext} from '@digita-ai/handlersjs-http';
import {AccessMode} from '../util/modes/AccessModes';
import {ResourceIdentifier} from '../util/ResourceIdentifier';
import {Authorizer} from './authz/Authorizer';
import {ClaimTokenProcessor, ClaimTokenRequest} from './authn/ClaimTokenProcessor';
import {Ticket, TicketFactory} from './TicketFactory';
import {TokenFactory} from './TokenFactory';
import {GrantTypeProcessor, TokenResponse} from './GrantTypeProcessor';
import {getLoggerFor, Logger} from '@laurensdeb/authorization-agent-helpers';
import {RequestDeniedError} from '../error/RequestDeniedError';
import {NeedInfoError} from '../error/NeedInfoError';

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
  protected readonly logger: Logger = getLoggerFor(this);

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
      const msg = 'The request is missing one of the required body parameters:'+
      ' {\'ticket\', \'claim_token\', \'claim_token_format\'}';
      this.logger.debug(msg);
      throw new BadRequestHttpError(msg);
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

    // Extract metadata from ticket
    const ticket = await this.ticketFactory.deserialize(body.get('ticket')!);

    // Construct principal object
    const principal = await this.authenticate(request, ticket);

    // Authorize request using principal
    const authorization = await this.authorize(ticket, principal);

    if (!authorization.modes.size) {
      const msg = 'Unable to authorize request.';
      this.logger.debug(msg);
      throw new RequestDeniedError(msg);
    }

    this.logger.info(`Generating new Access Token for resource '${authorization.sub.path}' ` +
    `and principal '${principal.webId}'`);

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
   * @param {Ticket} ticket
   * @return {Promise<Principal>} - authenticated principal
   */
  private async authenticate(req: ClaimTokenRequest, ticket: Ticket): Promise<Principal> {
    for (const processor of this.claimTokenProcessors) {
      let principal;
      try {
        principal = await processor.process(req);
      } catch (e: any) {
        throw new NeedInfoError((e as Error).message, await this.ticketFactory.serialize(ticket),
            {required_claims: {claim_token_format: this.claimTokenProcessors.map((p) => p.claimTokenFormat())}});
      }
      if (principal) {
        return principal;
      }
    }
    throw new NeedInfoError('Unsupported \'claim_token_format\' value', await this.ticketFactory.serialize(ticket),
        {required_claims: {claim_token_format: this.claimTokenProcessors.map((p) => p.claimTokenFormat())}});
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
