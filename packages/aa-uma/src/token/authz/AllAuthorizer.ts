import {Logger, getLoggerFor} from '@laurensdeb/authorization-agent-helpers';
import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {Authorizer, Principal, Ticket} from '@laurensdeb/authorization-agent-interfaces';

/**
 * Mock authorizer granting all specified access modes
 * to any client.
 *
 * NOTE: DO NOT USE THIS IN PRODUCTION
 */
export class AllAuthorizer extends Authorizer {
  protected readonly logger: Logger = getLoggerFor(this);

  /**
     *
     * @param {AccessMode[]} accessModes - default access modes to be granted to any client.
     */
  constructor(private readonly accessModes: AccessMode[] =
  [AccessMode.read, AccessMode.write, AccessMode.append, AccessMode.delete, AccessMode.create]) {
    super();
    this.logger.warn(`The AllAuthorizer was enabled with modes ${accessModes.join(', ')}. ` +
    `DO NOT USE THIS IN PRODUCTION!`);
  }

  /**
   * Authorizes the client for specified request
   * @param {Principal} client - authenticated client
   * @param {Ticket} request - request to be authorized
   * @return {Promise<Set<AccessMode>>} - granted access modes
   */
  public async authorize(client: Principal, request: Ticket): Promise<Set<AccessMode>> {
    this.logger.debug(`Authorized request by ${client.webId} for ${request.sub.iri}`);
    return new Set(this.accessModes);
  }
}
