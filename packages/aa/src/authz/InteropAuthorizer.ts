import {Authorizer, Principal, Ticket} from '@thundr-be/sai-interfaces';
import {AccessMode, getLoggerFor} from '@thundr-be/sai-helpers';
import {Application, AuthenticatedClient, RequestedPermissions, SocialAgent} from './strategy/Types';
import {InteropBaseAuthorizerStrategy} from './strategy/InteropBaseAuthorizerStrategy';
import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {AuthorizationAgentFactory} from '../factory/AuthorizationAgentFactory';
import {getRegistrationForAgent} from '../util/getRegistrationForAgent';
import LRUCache from 'lru-cache';

/**
 * An InteropAuthorizer authorizes incoming requests
 * made by some principal using the Agent Registries
 * from the Interoperability Specification
 *
 */
export class InteropAuthorizer extends Authorizer {
  private readonly logger = getLoggerFor(this);
  private readonly authorizationAgentCache = new LRUCache<string, AuthorizationAgent>({
    max: 25,
  });

  /**
   * @param {InteropBaseAuthorizerStrategy[]} strategies - strategies to be evaluated on an incoming request
   */
  constructor(private readonly strategies: InteropBaseAuthorizerStrategy[],
              private readonly authorizationAgentFactory: AuthorizationAgentFactory) {
    super();
  }

  /**
     * Authorizes the request
     * @param {Principal} client
     * @param {Ticket} request
     */
  public async authorize(client: Principal, request: Ticket): Promise<Set<AccessMode>> {
    const result = new Set<AccessMode>();
    try {
      const authenticatedClient = this.getAuthenticatedClient(client, request);
      const requestedPermissions = this.getRequestedPermissions(request);


      // 1. Short circuit if no agent registration exists for the SocialAgent or Application
      const authorizationAgent = await this.getAuthorizationAgentForRequest(requestedPermissions);

      if (!(await this.hasRegistrationForAgent(authorizationAgent, authenticatedClient))) {
        throw new Error(`Agent ${JSON.stringify(authenticatedClient)} does not have a registration.`);
      }

      // 2. Else pass through each of the authorizers to determine whether the request can be authorized
      for (const strategy of this.strategies) {
        let modes;
        try {
          modes = await strategy.authorize(authorizationAgent, requestedPermissions, authenticatedClient);
        } catch (e) {
          this.logger.warn(`Error in strategy ${typeof strategy}: ${(e as Error).message}`, e);
          // ignored
        }
        // Waterfall strategy: We assume each strategy applies to non-overlapping resources
        //                     thus as soon as any returns access modes, we assume the authorize function to return.
        if (modes && modes.size) {
          modes.forEach((mode) => result.add(mode));
          break;
        }
      }
    } catch (e: any) {
      this.logger.warn(`Interoperability Authorization failed: ${(e as Error).message}`, e);
    }

    this.logger.info(`Authorized with access modes ${[...result].map((v) => `"${v}"`).join(', ')}`);
    return result;
  }

  /**
   * Get the AuthenticatedClient for the request,
   * which is either an Application used by the resource
   * owner or a SocialAgent.
   *
   * @param {Principal} client
   * @param {Ticket} request
   * @return {AuthenticatedClient}
   */
  private getAuthenticatedClient(client: Principal, request: Ticket): AuthenticatedClient {
    if (client.webId === request.owner) {
      if (!client.clientId) {
        throw new Error('Cannot authenticate agent without clientId as Application');
      }
      return new Application(client.webId, client.clientId);
    }
    return new SocialAgent(client.webId);
  }

  /**
   * Returns an object matching the
   * RequestedPermissions in the request
   * Ticket from the UMA AS.
   *
   * @param {Ticket} request
   * @return {RequestedPermissions}
   */
  private getRequestedPermissions(request: Ticket): RequestedPermissions {
    return {
      modes: request.requested,
      owner: request.owner,
      resource: request.sub.iri,
    };
  }

  /**
     * This method returns an Authorization Agent which
     * is applicable to the request currently being processed.
     *
     * @param {RequestedPermissions} request
     * @return {Promise<AuthorizationAgent>}
     */
  private async getAuthorizationAgentForRequest(request: RequestedPermissions): Promise<AuthorizationAgent> {
    if (this.authorizationAgentCache.has(request.owner)) {
      return this.authorizationAgentCache.get(request.owner)!;
    }
    const res = await this.authorizationAgentFactory.getAuthorizationAgent(request.owner);
    this.authorizationAgentCache.set(request.owner, res);
    return res;
  }

  /**
   * This method returns whether a Registration exists
   * for the agent that is performing the request.
   *
   * @param {AuthorizationAgent} authorizationAgent
   * @param {AuthenticatedClient} client
   * @return {Promise<boolean>}
   */
  private async hasRegistrationForAgent(authorizationAgent: AuthorizationAgent,
      client: AuthenticatedClient): Promise<boolean> {
    return !!(await getRegistrationForAgent(authorizationAgent, client));
  }
}
