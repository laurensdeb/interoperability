import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {CRUDApplicationRegistration} from '@janeirodigital/interop-data-model';
import {Application} from '../../Types';
import {AuthenticatedClient} from '../../Types';
import {AgentRegistrationBaseStrategy} from './AgentRegistrationBaseStrategy';

/**
 * The ApplicationRegistrationStrategy is tasked with authorizing
 * access to Application Registrations as defined under the
 * Interoperability Specification.
 *
 * These should be fully accessible to the Applications which
 * they refer to.
 *
 * @link https://solid.github.io/data-interoperability-panel/specification/#application-registration
 */
export class ApplicationRegistrationStrategy
  extends AgentRegistrationBaseStrategy<CRUDApplicationRegistration, Application> {
  /**
   * Determines if the client that is being authorized
   * is in fact supported by the strategy
   *
   * @param {AuthenticatedClient} value
   * @return {boolean}
   */
  protected isSupportedClient(value: AuthenticatedClient): value is Application {
    if (!(value instanceof Application)) {
      return false;
    }
    return true;
  }
  /**
   * Retrieve the applicable social agent registration
   * for the specified client, if any exists.
   *
   * @param {AuthorizationAgent} authorizationAgent
   * @param {Application} client
   * @return {Promise<CRUDApplicationRegistration | undefined>}
   */
  protected async getRegistrationForClient(authorizationAgent: AuthorizationAgent,
      client: Application): Promise<CRUDApplicationRegistration | undefined> {
    return await authorizationAgent.findApplicationRegistration(client.clientId);
  }
}
