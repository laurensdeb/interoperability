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
     * Authorizes a request to SocialAgentRegistration
     * for the registeredAgent of the Social Agent Registration
     * with Read permissions.
     *
     * @param {RequestedPermissions} request
     * @param {AuthenticatedClient} client
     * @return {Promise<Set<AccessMode>>}
     */
  public async authorize(request: RequestedPermissions, client: AuthenticatedClient): Promise<Set<AccessMode>> {
    const result = new Set<AccessMode>();

    if (!this.isSupportedClient(client)) {
      return result;
    }

    const authorizationAgent = await this.getAuthorizationAgentForRequest(request);
    const registration = await this.getRegistrationForClient(authorizationAgent, client);

    if (!!registration &&
      this.isAuthorizationSubject(registration, request) &&
      this.isAuthorizedClient(registration, client)) {
      PERMITTED_ACCESS_MODES.forEach((mode) => result.add(mode));
    }

    return result;
  }

  protected abstract isSupportedClient(value: AuthenticatedClient): value is S;

  protected abstract getRegistrationForClient(authorizationAgent: AuthorizationAgent,
    client: S): Promise<T | undefined>;

  protected abstract isAuthorizationSubject(registration: T, request: RequestedPermissions): boolean;

  protected abstract isAuthorizedClient(registration: T, client: S): boolean;
}
