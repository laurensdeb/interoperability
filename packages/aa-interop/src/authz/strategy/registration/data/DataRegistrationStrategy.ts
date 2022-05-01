import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {AccessMode, getLoggerFor, Logger} from '@laurensdeb/authorization-agent-helpers';
import {getDataGrantsForClient} from '../../grant/getDataGrantsForClient';
import {InteropBaseAuthorizerStrategy} from '../../InteropBaseAuthorizerStrategy';
import {RequestedPermissions, AuthenticatedClient} from '../../Types';

const PERMITTED_ACCESS_MODES = [AccessMode.read];

/**
 * The DataRegistrationStrategy is tasked with authorizing
 * access to Data Registrations by a Social Agent or Application as defined under the
 * Interoperability Specification.
 *
 * These should be fully accessible to the Applications and Clients which
 * have data grants referencing the registration.
 *
 * @link https://solid.github.io/data-interoperability-panel/specification/#data-registration
 */
export class DataRegistrationStrategy extends InteropBaseAuthorizerStrategy {
  private readonly logger: Logger = getLoggerFor(this);
  /**
     * Authorizes a request to a Data Registration
     * for an agent with a Data Grant referencing
     * the registration.
     *
     * @param {AuthorizationAgent} authorizationAgent
     * @param {RequestedPermissions} request
     * @param {AuthenticatedClient} client
     * @return {Promise<Set<AccessMode>>}
     */
  public async authorize(authorizationAgent: AuthorizationAgent,
      request: RequestedPermissions, client: AuthenticatedClient): Promise<Set<AccessMode>> {
    this.logger.debug(`Checking if '${request.resource} is registration for Data Grant`);
    const result = new Set<AccessMode>();

    const grants = await getDataGrantsForClient(authorizationAgent, client);
    this.logger.debug(`Found ${grants?grants.length:'no'} grants for client.`);

    if (grants && grants.some((grant) => grant.hasDataRegistration &&
      (grant.hasDataRegistration == request.resource))) {
      PERMITTED_ACCESS_MODES.forEach((mode) => result.add(mode));
    }

    return result;
  }
}
