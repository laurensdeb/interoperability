import {AccessMode} from '@laurensdeb/authorization-agent-helpers';

export type AuthenticatedClient = SocialAgent | Application;

/**
 * Class representing a Social Agent
 */
export class SocialAgent {
  /**
     * @param {string} webId
     */
  constructor(public readonly webId: string) {

  }
}
/**
 * Class representing an Application
 * through which the Pod owner is signed in.
 */
export class Application {
  /**
     * @param {string} clientId
     */
  constructor(public readonly clientId: string) {

  }
}

export type RequestedPermissions = {
    resource: string,
    modes: Set<AccessMode>,
    owner: string
}
