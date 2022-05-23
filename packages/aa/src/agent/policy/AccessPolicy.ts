import {DataAuthorizationData} from '@janeirodigital/interop-data-model';
import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';

export type AccessAuthorization = {
    grantee: string;
    hasAccessNeedGroup: string;
    dataAuthorizations: DataAuthorizationData[];
  }

/**
 * An AccessPolicy is applied to a set
 * of Access Needs presented by an agent
 * (data processor) and evaluated in order
 * to obtain an Access Authorization
 */
export abstract class AccessPolicy {
    public abstract handle(aa: AuthorizationAgent, accessNeedsGroup: URL, agent: URL): AccessAuthorization;
}
