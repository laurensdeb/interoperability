import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {AuthenticatedClient, RequestedPermissions} from './Types';
/**
 * Base class for authorizing requests using
 * the Solid Application Interoperability datastructures
 */
export abstract class InteropBaseAuthorizerStrategy {
    public abstract authorize(authorizationAgent: AuthorizationAgent,
      request: RequestedPermissions, client: AuthenticatedClient): Promise<Set<AccessMode>>;
}
