import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {InteropBaseAuthorizerStrategy} from '../../InteropBaseAuthorizerStrategy';
import {RequestedPermissions, AuthenticatedClient} from '../../Types';
import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';

const PERMITTED_ACCESS_MODES = [AccessMode.read];

export type Registration = {
  iri: string,
  registeredAgent: string
}

/**
 * Base strategy for authorizing requests
 * pertaining to Application and Agent Registrations
 *
 */
export abstract class AgentRegistrationBaseStrategy<T extends Registration, S extends AuthenticatedClient>
  extends InteropBaseAuthorizerStrategy {
  /**
     * Authorizes a request to SocialAgentRegistration or ApplicationRegistration
     * for its registeredAgent with Read permissions.
     *
     * @param {AuthorizationAgent} authorizationAgent
     * @param {RequestedPermissions} request
     * @param {AuthenticatedClient} client
     * @return {Promise<Set<AccessMode>>}
     */
  public async authorize(authorizationAgent: AuthorizationAgent,
      request: RequestedPermissions, client: AuthenticatedClient): Promise<Set<AccessMode>> {
    const result = new Set<AccessMode>();

    if (!this.isSupportedClient(client)) {
      return result;
    }

    const registration = await this.getRegistrationForClient(authorizationAgent, client);

    if (!!registration &&
      this.isAuthorizationSubject(registration, request)) {
      PERMITTED_ACCESS_MODES.forEach((mode) => result.add(mode));
    }

    return result;
  }

  protected abstract isSupportedClient(value: AuthenticatedClient): value is S;

  protected abstract getRegistrationForClient(authorizationAgent: AuthorizationAgent,
    client: S): Promise<T | undefined>;

  /**
   * Determines whether the registration IRI matches
   * with the authorization request subject or not.
   *
   * @param {T} registration
   * @param {RequestedPermissions} request
   * @return {boolean}
   */
  protected isAuthorizationSubject(registration: T, request: RequestedPermissions): boolean {
    return registration.iri === request.resource;
  }
}
