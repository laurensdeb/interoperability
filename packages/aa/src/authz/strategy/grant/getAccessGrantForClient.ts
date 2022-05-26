import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {CRUDApplicationRegistration, CRUDSocialAgentRegistration,
  ReadableAccessGrant} from '@janeirodigital/interop-data-model';
import {Application, AuthenticatedClient, SocialAgent} from '../Types';

import LRUCache from 'lru-cache';
import {getLoggerFor} from '@thundr-be/sai-helpers';

const agentRegistrationCache = new LRUCache<string, CRUDSocialAgentRegistration>({
  max: 25,
  ttl: 60 * 1000,
});
const getAgentRegistrationCacheKey = (aa: AuthorizationAgent, client: SocialAgent) => `${aa.webId}-${client.webId}`;
const appRegistrationCache = new LRUCache<string, CRUDApplicationRegistration>({
  max: 25,
  ttl: 60 * 1000,
});
const getAppRegistrationCacheKey = (aa: AuthorizationAgent, client: Application) => `${aa.webId}-${client.clientId}`;

const logger = getLoggerFor('getAccessGrantForClient');
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
    const cacheKey = getAgentRegistrationCacheKey(authorizationAgent, client);
    if (agentRegistrationCache.has(cacheKey)) {
      return agentRegistrationCache.get(cacheKey)?.accessGrant;
    }
    logger.info('Cache Miss');
    const agentRegistration = await authorizationAgent.findSocialAgentRegistration(client.webId);
    if (agentRegistration) {
      agentRegistrationCache.set(cacheKey, agentRegistration);
      return agentRegistration.accessGrant;
    }
  } else {
    const cacheKey = getAppRegistrationCacheKey(authorizationAgent, client);
    if (appRegistrationCache.has(cacheKey)) {
      return appRegistrationCache.get(cacheKey)?.accessGrant;
    }
    logger.info('Cache Miss');
    const applicationRegistration = await authorizationAgent.findApplicationRegistration(client.clientId);
    if (applicationRegistration) {
      appRegistrationCache.set(cacheKey, applicationRegistration);
      return applicationRegistration.accessGrant;
    }
  }
  return undefined;
}
