import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {CRUDSocialAgentRegistration} from '@janeirodigital/interop-data-model';
import {SocialAgent} from '../../Types';
import {AuthenticatedClient} from '../../Types';
import {AgentRegistrationBaseStrategy} from './AgentRegistrationBaseStrategy';

/**
 * The AgentRegistrationStrategy is tasked with authorizing
 * access to SocialAgentRegistrations as defined under the
 * Interoperability Specification.
 *
 * These should be fully accessible to the Social Agent which
 * they refer to.
 *
 * @link https://solid.github.io/data-interoperability-panel/specification/#social-agent-registration
 */
export class SocialAgentRegistrationStrategy
  extends AgentRegistrationBaseStrategy<CRUDSocialAgentRegistration, SocialAgent> {
  /**
   * Determines if the client that is being authorized
   * is in fact supported by the strategy
   *
   * @param {AuthenticatedClient} value
   * @return {boolean}
   */
  protected isSupportedClient(value: AuthenticatedClient): value is SocialAgent {
    return value instanceof SocialAgent;
  }
  /**
   * Retrieve the applicable social agent registration
   * for the specified client, if any exists.
   *
   * @param {AuthorizationAgent} authorizationAgent
   * @param {AuthenticatedClient} client
   * @return {Promise<CRUDSocialAgentRegistration | undefined>}
   */
  protected async getRegistrationForClient(authorizationAgent: AuthorizationAgent,
      client: SocialAgent): Promise<CRUDSocialAgentRegistration | undefined> {
    return await authorizationAgent.findSocialAgentRegistration(client.webId);
  }
}
