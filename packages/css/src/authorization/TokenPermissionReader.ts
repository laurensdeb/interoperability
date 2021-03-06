import {AccessMode, getLoggerFor} from '@solid/community-server';
import {PermissionReader, PermissionReaderInput} from './PermissionReader';
import {PermissionSet} from './permissions/Permissions';

/**
 * PermissionReader using input from UMA Token to authorize the request.
 */
export class TokenPermissionReader extends PermissionReader {
  protected readonly logger = getLoggerFor(this);

  /**
     * Converts ticket to PermissionSet
     * @param {PermissionReaderInput} input
     * @return {Promise<PermissionSet>}
     */
  public async handle(input: PermissionReaderInput): Promise<PermissionSet> {
    const result: PermissionSet = {};

    if (input.credentials.ticket?.resource?.path === input.identifier.path && input.credentials.ticket?.modes) {
      result.ticket = this.ticketModesToPermissions(input.credentials.ticket.modes);
      this.logger.info(`Read permissions from ${JSON.stringify(result)}`);
    }

    return result;
  }

  /**
   * Convert access modes in ticket to permissions
   * @param {Set<AccessMode>} modes - discovered access modes
   * @return {Partial<Record<AccessMode, boolean>>}
   */
  private ticketModesToPermissions(modes: Set<AccessMode>): Partial<Record<AccessMode, boolean>> {
    return Object.freeze({
      read: modes.has(AccessMode.read),
      write: modes.has(AccessMode.write),
      append: modes.has(AccessMode.append),
      create: modes.has(AccessMode.create),
      delete: modes.has(AccessMode.delete),
    });
  }
}
