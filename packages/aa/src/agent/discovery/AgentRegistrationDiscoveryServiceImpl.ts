import {NotFoundHttpError, NotImplementedHttpError, UnauthorizedHttpError} from '@digita-ai/handlersjs-http';
import {getLoggerFor, Logger} from '@thundr-be/sai-helpers';
import {Application, AuthenticatedClient, SocialAgent} from '../../authz/strategy/Types';
import {AuthorizationAgentFactory} from '../../factory/AuthorizationAgentFactory';
import {ClientIdStrategy} from '../../factory/ClientIdStrategy';
import {getRegistrationForAgent} from '../../util/getRegistrationForAgent';
import {AuthenticationResult, TokenVerifier} from '../authn/TokenVerifier';
import {AgentRegistrationDiscoveryService,
  DiscoveryRequest, DiscoveryResponse} from './AgentRegistrationDiscoveryService';
import {RegistrationRequiredError} from './error/RegistrationRequiredError';

/**
 * Implementation of the AgentRegistrationDiscoveryService
 * using the data provided by the Solid Application Interoperability
 * registries.
 */
export class AgentRegistrationDiscoveryServiceImpl extends AgentRegistrationDiscoveryService {
  private readonly logger: Logger = getLoggerFor(this);

  /**
     * @param {TokenVerifier} verifier
     * @param {ClientIdStrategy} clientIdStrategy
     */
  constructor(private readonly verifier: TokenVerifier,
    private readonly clientIdStrategy: ClientIdStrategy,
    private readonly authorizationAgentFactory: AuthorizationAgentFactory) {
    super();
  }
  /**
     * Handles a DiscoveryRequest by authenticating the
     * incoming requestor, determining the owner WebID
     * and then fetching the relevant Application/Social Agent registration.
     *
     * @param {DiscoveryRequest} req
     * @return {Promise<DiscoveryResponse>}
     */
  async handle(req: DiscoveryRequest): Promise<DiscoveryResponse> {
    this.logger.debug('Handling discovery request.');
    let webId;
    try {
      webId = await this.clientIdStrategy.getWebIdForClientId(req.request_uri);
    } catch (e: any) {
      this.logger.debug(`Unable to discovery authorization agent for WebID: ${(e as Error).message}`, e);
      throw new NotFoundHttpError();
    }

    if (!req.headers.authorization || !/^(DPoP|Bearer) /ui.test(req.headers.authorization)) {
      throw new NotImplementedHttpError('No valid Authorization header specified.');
    }
    const token = /^(DPoP|Bearer)\s+(.*)/ui.exec(req.headers.authorization!)![2];

    const agent = await this.verifier.authenticate({
      method: 'HEAD',
      dpop: req.headers?.dpop,
      bearer: token,
      url: req.request_uri,
    });

    let aa;
    try {
      aa = await this.authorizationAgentFactory.getAuthorizationAgent(webId);
    } catch (e) {
      const msg = `No authorization agent for WebID ${webId}`;
      this.logger.debug(msg, e);
      throw new NotFoundHttpError(msg);
    }

    const client = this.getAuthenticatedClientForAuthenticationResult(agent, webId);
    const registration = await getRegistrationForAgent(aa, client);
    if (!registration) {
      throw new RegistrationRequiredError(`No registration exists for agent "${this.getAgentIri(client)}"`,
          {redirect_user: 'https://example.com'});
    }

    return {agent_registration: registration.iri,
      agent_iri: this.getAgentIri(client)};
  }

  /**
   * Returns the IRI used for identifying the authenticated agent.
   *
   * @param {AuthenticatedClient} client
   * @return {string}
   */
  private getAgentIri(client: AuthenticatedClient): string {
    return client instanceof SocialAgent ? client.webId : client.clientId;
  }

  /**
   * @param {AuthenticationResult} res
   * @param {string} owner - owner WebID
   * @return {AuthenticatedClient}
   */
  private getAuthenticatedClientForAuthenticationResult(res: AuthenticationResult,
      owner: string): AuthenticatedClient {
    if (owner === res.webId) {
      if (!res.clientId) {
        throw new UnauthorizedHttpError('Cannot authenticate owner without clientId as Application');
      }
      return new Application(res.webId, res.clientId);
    }
    return new SocialAgent(res.webId);
  }
}
