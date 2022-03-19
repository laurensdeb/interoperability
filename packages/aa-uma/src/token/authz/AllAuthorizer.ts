import {AccessMode} from '../../util/modes/AccessModes';
import {Ticket} from '../TicketFactory';
import {Principal} from '../UmaGrantProcessor';
import {Authorizer} from './Authorizer';

/**
 * Mock authorizer granting all specified access modes
 * to any client.
 *
 * NOTE: DO NOT USE THIS IN PRODUCTION
 */
export class AllAuthorizer extends Authorizer {
  /**
     *
     * @param {AccessMode[]} accessModes - default access modes to be granted to any client.
     */
  constructor(private readonly accessModes: AccessMode[] =
  [AccessMode.read, AccessMode.write, AccessMode.append, AccessMode.delete, AccessMode.create]) {
    super();
  }

  /**
   * Authorizes the client for specified request
   * @param {Principal} client - authenticated client
   * @param {Ticket} request - request to be authorized
   * @return {Promise<Set<AccessMode>>} - granted access modes
   */
  public async authorize(client: Principal, request: Ticket): Promise<Set<AccessMode>> {
    return new Set(this.accessModes);
  }
}
