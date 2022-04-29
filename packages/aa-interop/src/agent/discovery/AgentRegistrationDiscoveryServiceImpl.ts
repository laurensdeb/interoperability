import {NotFoundHttpError, NotImplementedHttpError} from '@digita-ai/handlersjs-http';
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
    // Determine owner WebID
    let webId;
    try {
      webId = await this.clientIdStrategy.getWebIdForClientId(req.request_uri);
    } catch (e: any) {
      throw new NotFoundHttpError();
    }

    // Authenticate Client
    if (!req.headers.authorization || !/^DPoP /ui.test(req.headers.authorization)) {
      throw new NotImplementedHttpError('No DPoP-bound Authorization header specified.');
    }
    const token = /^DPoP\s+(.*)/ui.exec(req.headers.authorization!)![1];

    const agent = await this.verifier.authenticate({
      method: 'HEAD',
      dpop: req.headers?.dpop,
      bearer: token,
      url: req.request_uri,
    });

    // Create Authorization Agent
    const aa = await this.authorizationAgentFactory.getAuthorizationAgent(webId);

    // Find Application/Social Agent Registration
    const client = this.getAuthenticatedClientForAuthenticationResult(agent, webId);
    const registration = await getRegistrationForAgent(aa, client);
    if (!registration) {
      throw new RegistrationRequiredError(`No registration exists for agent "${this.getAgentIri(client)}"`,
          {redirect_user: 'https://example.com'});
    }

    // If none found: throw RegistrationRequiredError with Redirect URI following some strategy
    // Else return URI
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
        throw new Error('Cannot authenticate agent without clientId as Application');
      }
      return new Application(res.webId, res.clientId);
    }
    return new SocialAgent(res.webId);
  }
}
