import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {DataGrant} from '@janeirodigital/interop-data-model';
import {AuthenticatedClient} from '../Types';
import {getAccessGrantForClient} from './getAccessGrantForClient';

/**
     * Retrieve the applicable Data Grants for this
     * client.
     *
     * @param {AuthorizationAgent} authorizationAgent
     * @param {AuthenticatedClient} client
     * @return {Promise<DataGrant[] | undefined>}
     */
export async function getDataGrantsForClient(authorizationAgent: AuthorizationAgent, client: AuthenticatedClient):
Promise<DataGrant[] | undefined> {
  const accessGrant = await getAccessGrantForClient(authorizationAgent, client);
  if (accessGrant) {
    await accessGrant.bootstrap();
    return accessGrant.hasDataGrant;
  }
  return undefined;
}
