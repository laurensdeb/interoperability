import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {ReadableAccessGrant} from '@janeirodigital/interop-data-model';
import {AuthenticatedClient} from '../Types';
import {getAccessGrantForClient} from './getAccessGrantForClient';
import {GrantBaseStrategy} from './GrantBaseStrategy';

/**
 * The AccessGrantStrategy is tasked with authorizing
 * access to Access Grants as defined under the
 * Interoperability Specification.
 *
 * These should be fully accessible to the Applications and Clients which
 * they have been granted to.
 *
 * @link https://solid.github.io/data-interoperability-panel/specification/#access-grant
 */
export class AccessGrantStrategy extends GrantBaseStrategy<ReadableAccessGrant> {
  /**
     * Retrieve the applicable Access Grants for this
     * client.
     *
     * @param {AuthorizationAgent} authorizationAgent
     * @param {AuthenticatedClient} client
     * @return {Promise<ReadableAccessGrant[] | undefined>}
     */
  protected async getGrantsForClient(authorizationAgent: AuthorizationAgent, client: AuthenticatedClient):
   Promise<ReadableAccessGrant[] | undefined> {
    const accessGrant = await getAccessGrantForClient(authorizationAgent, client);
    if (!accessGrant) {
      return undefined;
    }
    return [accessGrant];
  }
}
