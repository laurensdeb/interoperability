import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {DataGrant} from '@janeirodigital/interop-data-model';
import {AuthenticatedClient} from '../Types';
import {getDataGrantsForClient} from './getDataGrantsForClient';
import {GrantBaseStrategy} from './GrantBaseStrategy';

/**
 * The DataGrantStrategy is tasked with authorizing
 * access to Data Grants as defined under the
 * Interoperability Specification.
 *
 * These should be fully accessible to the Applications and Clients which
 * they have been granted to.
 *
 * @link https://solid.github.io/data-interoperability-panel/specification/#application-registration
 */
export class DataGrantStrategy extends GrantBaseStrategy<DataGrant> {
  /**
     * Retrieve the applicable Data Grants for this
     * client.
     *
     * @param {AuthorizationAgent} authorizationAgent
     * @param {AuthenticatedClient} client
     * @return {Promise<DataGrant[] | undefined>}
     */
  protected async getGrantsForClient(authorizationAgent: AuthorizationAgent, client: AuthenticatedClient):
   Promise<DataGrant[] | undefined> {
    return await getDataGrantsForClient(authorizationAgent, client);
  }
}
