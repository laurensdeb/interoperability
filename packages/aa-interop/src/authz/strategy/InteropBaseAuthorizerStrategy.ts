import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {AuthorizationAgentFactory} from '../../factory/AuthorizationAgentFactory';
import {AuthenticatedClient, RequestedPermissions} from './Types';
/**
 * Base class for authorizing requests using
 * the Solid Application Interoperability datastructures
 */
export abstract class InteropBaseAuthorizerStrategy {
  /**
     * @param {AuthorizationAgentFactory} authorizationAgentFactory
     */
  public constructor(protected readonly authorizationAgentFactory: AuthorizationAgentFactory) {

  }
    public abstract authorize(request: RequestedPermissions, client: AuthenticatedClient): Promise<Set<AccessMode>>;

    /**
     * This method returns an Authorization Agent which
     * is applicable to the request currently being processed.
     *
     * @param {RequestedPermissions} request
     * @return {Promise<AuthorizationAgent>}
     */
    protected async getAuthorizationAgentForRequest(request: RequestedPermissions): Promise<AuthorizationAgent> {
      return await this.authorizationAgentFactory.getAuthorizationAgent(request.owner);
    }
}
