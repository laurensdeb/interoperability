import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {getDataGrantsForClient} from '../grant/getDataGrantsForClient';
import {InteropBaseAuthorizerStrategy} from '../InteropBaseAuthorizerStrategy';
import {RequestedPermissions, AuthenticatedClient} from '../Types';

/**
   * The DataInstanceStrategy is tasked with
   * authorizing requests to Data Instances made by Social
   * Agents or Applications which have previously been given
   * a Data Grant that pertains to this instance.
   *
   * @link https://solid.github.io/data-interoperability-panel/specification/#data-grant
   */
export class DataInstanceStrategy extends InteropBaseAuthorizerStrategy {
  /**
     * Authorizes a request to a Data Instance
     * for an agent with a Data Grant referencing
     * the instance or its registration.
     *
     * @param {AuthorizationAgent} authorizationAgent
     * @param {RequestedPermissions} request
     * @param {AuthenticatedClient} client
     * @return {Promise<Set<AccessMode>>}
     */
  public async authorize(authorizationAgent: AuthorizationAgent,
      request: RequestedPermissions, client: AuthenticatedClient): Promise<Set<AccessMode>> {
    const result = new Set<AccessMode>();
    const dataGrants = await getDataGrantsForClient(authorizationAgent, client);
    if (!dataGrants) {
      return result;
    }

    for (const dataGrant of dataGrants) {
      for await (const instance of dataGrant.getDataInstanceIterator()) {
        if (instance.iri === request.resource) {
          instance.accessMode
              .filter((mode) => Object.values(AccessMode).some((v) => v === mode))
              .map((mode) => mode as AccessMode)
              .filter((mode) => request.modes.has(mode))
              .forEach((mode) => result.add(mode));
        }
      }
    }

    return result;
  }
}
