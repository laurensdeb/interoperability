import {Logger, getLoggerFor} from '@thundr-be/sai-helpers';
import {SignJWT, createLocalJWKSet, jwtVerify} from 'jose';
import {v4} from 'uuid';
import {InvalidGrantError} from '../error/InvalidGrantError';
import {JwksKeyHolder} from '@thundr-be/sai-helpers';
import {parseModes} from '@thundr-be/sai-helpers';
import {isString} from '../util/StringGuard';
import {TicketFactory} from './TicketFactory';
import {Ticket} from '@thundr-be/sai-interfaces';

const AUD = 'solid';

export interface JwtTicketParams {
    expirationTime: string | number,
}

/**
 * A UMA Ticket Factory using JWTs for tickets.
 */
export class JwtTicketFactory extends TicketFactory {
  protected readonly logger: Logger = getLoggerFor(this);

  /**
     * Construct a new ticket factory
     * @param {JwksKeyHolder} keyholder - keyholder to be used in issuance
     */
  constructor(private readonly keyholder: JwksKeyHolder, private readonly issuer: string,
    private readonly params: JwtTicketParams = {expirationTime: '30m'}) {
    super();
  }

  /**
   * Serializes ticket as JWT
   * @param {Ticket} ticket - request ticket
   * @return {Promise<string>} - JWT serialized sticket
   */
  async serialize(ticket: Ticket): Promise<string> {
    const kid = await this.keyholder.getDefaultKey();
    const jwt = await new SignJWT({owner: ticket.owner, sub: ticket.sub.iri, modes: [...ticket.requested]})
        .setProtectedHeader({alg: this.keyholder.getAlg(), kid})
        .setIssuedAt()
        .setIssuer(this.issuer)
        .setAudience(AUD)
        .setExpirationTime(this.params.expirationTime)
        .setJti(v4())
        .sign(this.keyholder.getPrivateKey(kid));
    this.logger.debug('Issued new JWT Ticket', ticket);
    return jwt;
  }

  /**
   * Deserialize JWT to Ticket
   * @param {string} jwt - JWT string
   * @return {Promise<Ticket>} - deserialized ticket.
   */
  async deserialize(jwt: string): Promise<Ticket> {
    const jwks = createLocalJWKSet(await this.keyholder.getJwks());
    try {
      // TODO: replay protection
      const {payload} = await jwtVerify(jwt, jwks, {
        issuer: this.issuer,
        audience: AUD,
      });

      if (!payload.sub || !payload.aud || !payload.modes || !payload.owner) {
        throw new Error('Missing JWT parameter(s): {sub, aud, modes, owner} are required.');
      }
      if (!isString(payload.owner)) {
        throw new Error('JWT claim "owner" is not a string.');
      }
      if (!Array.isArray(payload.modes)) {
        throw new Error('JWT claim "modes" is not an array.');
      }

      return {sub: {iri: payload.sub}, owner: payload.owner, requested: parseModes(payload.modes)};
    } catch (error: any) {
      const msg = `Invalid UMA Ticket provided, error while parsing: ${error.message}`;
      this.logger.debug(msg);
      throw new InvalidGrantError(msg);
    }
  }
}
