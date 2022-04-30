import {AuthenticatedClient, SocialAgent} from '../authz/strategy/Types';
import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {CRUDSocialAgentRegistration, CRUDApplicationRegistration} from '@janeirodigital/interop-data-model';

/**
   * This method returns whether a Registration exists
   * for the agent that is performing the request.
   *
   * @param {AuthorizationAgent} authorizationAgent
   * @param {AuthenticatedClient} client
   * @return {Promise<boolean>}
   */
export async function getRegistrationForAgent(authorizationAgent: AuthorizationAgent,
    client: AuthenticatedClient): Promise<CRUDSocialAgentRegistration | CRUDApplicationRegistration | undefined> {
  if (client instanceof SocialAgent) {
    return await authorizationAgent.findSocialAgentRegistration(client.webId);
  } else {
    return await authorizationAgent.findApplicationRegistration(client.clientId);
  }
}
