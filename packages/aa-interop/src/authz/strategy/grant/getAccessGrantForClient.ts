import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {ReadableAccessGrant} from '@janeirodigital/interop-data-model';
import {AuthenticatedClient, SocialAgent} from '../Types';

/**
     * Retrieve the applicable Access Grants for this
     * client.
     *
     * @param {AuthorizationAgent} authorizationAgent
     * @param {AuthenticatedClient} client
     * @return {Promise<ReadableAccessGrant | undefined>}
     */
export async function getAccessGrantForClient(authorizationAgent: AuthorizationAgent, client: AuthenticatedClient):
Promise<ReadableAccessGrant | undefined> {
  if (client instanceof SocialAgent) {
    const agentRegistration = await authorizationAgent.findSocialAgentRegistration(client.webId);
    if (agentRegistration) {
      return agentRegistration.accessGrant;
    }
  } else {
    const applicationRegistration = await authorizationAgent.findApplicationRegistration(client.clientId);
    if (applicationRegistration) {
      return applicationRegistration.accessGrant;
    }
  }
  return undefined;
}
