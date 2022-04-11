import {Authorizer, Principal, Ticket} from '@laurensdeb/authorization-agent-uma';
import {AccessMode} from '@laurensdeb/authorization-agent-uma/dist/util/modes/AccessModes';

/**
 * An InteropAuthorizer authorizes incoming requests
 * made by some principal using the Agent Registries
 * from the Interoperability Specification
 *
 */
export class InteropAuthorizer extends Authorizer {
  /**
     * Authorizes the request
     * @param {Principal} client
     * @param {Ticket} request
     */
  authorize(client: Principal, request: Ticket): Promise<Set<AccessMode>> {
    // 0. Determine whether the request is within the Realm of the AA
    // 1. Locate the access grants for the given client
    // 2. From this collection of ShapeTree instances and their authorized Access Modes:
    //      2a. Determine whether the request references a resource in an authorized ShapeTree
    //      2b. Return the AccessModes for this ShapeTree
    throw new Error('Method not implemented.');
  }
}
