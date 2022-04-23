import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {InteropBaseAuthorizerStrategy} from '../InteropBaseAuthorizerStrategy';
import {RequestedPermissions, AuthenticatedClient} from '../Types';

const PERMITTED_ACCESS_MODES = [AccessMode.read];


export type Grant = {
    iri: string
  }

/**
   * Base strategy for authorizing requests
   * pertaining to Access and Data Grants
   *
   */
export abstract class GrantBaseStrategy<T extends Grant>
  extends InteropBaseAuthorizerStrategy {
  /**
     * Authorizes a request to a Data Grant or Access Grant
     * for its grantee with Read permissions
     *
     * @param {RequestedPermissions} request
     * @param {AuthenticatedClient} client
     * @return {Promise<Set<AccessMode>>}
     */
  public async authorize(request: RequestedPermissions, client: AuthenticatedClient): Promise<Set<AccessMode>> {
    const result = new Set<AccessMode>();

    const authorizationAgent = await this.getAuthorizationAgentForRequest(request);
    const grants = await this.getGrantsForClient(authorizationAgent, client);

    if (!!grants && this.isAuthorizationSubject(grants, request)) {
      PERMITTED_ACCESS_MODES.forEach((mode) => result.add(mode));
    }

    return result;
  }

  protected abstract getGrantsForClient(authorizationAgent: AuthorizationAgent,
    client: AuthenticatedClient): Promise<T[] | undefined>;

  /**
    * Determines whether the resource IRI matches
    * with any of the grants.
    *
    * @param {T[]} grants
    * @param {RequestedPermissions} request
    * @return {boolean}
    */
  protected isAuthorizationSubject(grants: T[], request: RequestedPermissions): boolean {
    return grants.some((grant) => (grant.iri === request.resource));
  }
}
