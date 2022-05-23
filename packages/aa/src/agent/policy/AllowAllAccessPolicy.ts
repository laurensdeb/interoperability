import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {AccessAuthorization, AccessPolicy} from './AccessPolicy';

/**
 * An Allow-All Access Policy will pass through
 * any request it gets and allow all access.
 */
export class AllowAllAccessPolicy extends AccessPolicy {
  /**
   * Handles the Access Authorization.
   * @param {AuthorizationAgent} aa
   * @param {URL} accessNeedsGroup
   * @param {URL} agent
   */
  public handle(aa: AuthorizationAgent, accessNeedsGroup: URL, agent: URL): AccessAuthorization {
    // Dereference Access Needs Group
    // Validate Access Needs
    // Lookup Access Needs in Data Registry
    // Grant each need with scope:all
    throw new Error('Method not implemented.');
  }
}
