import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {FetchFactory} from '@laurensdeb/authorization-agent-helpers';
import {ClientIdStrategy} from './ClientIdStrategy';
import {randomUUID} from 'crypto';

/**
 * Factory class yielding an authorization
 * agent for some webid.
 */
export abstract class AuthorizationAgentFactory {
  public abstract getAuthorizationAgent(webid: string): Promise<AuthorizationAgent>;
}

/**
 * Factory class yielding an authorization
 * agent for some webid.
 */
export class AuthorizationAgentFactoryImpl extends AuthorizationAgentFactory {
  private readonly fetchFactory: FetchFactory;
  private readonly clientIdStrategy: ClientIdStrategy;

  /**
     * @param {FetchFactory} fetchFactory
     * @param {ClientIdStrategy} clientIdStrategy
     */
  constructor( fetchFactory: FetchFactory, clientIdStrategy: ClientIdStrategy) {
    super();
    this.fetchFactory = fetchFactory;
    this.clientIdStrategy = clientIdStrategy;
  }

  /**
   * Retrieve the AuthorizationAgent for some owner WebID
   * @param {string} webid - WebID of the Pod owner
   * @return {Promise<AuthorizationAgent>} - authorization agent
   */
  public async getAuthorizationAgent(webid: string): Promise<AuthorizationAgent> {
    return await AuthorizationAgent.build(webid, await this.clientIdStrategy.getClientIdForWebId(webid), {
      randomUUID,
      fetch: this.fetchFactory.getAuthenticatedFetch(),
    });
  }
}
