import {BadRequestHttpError} from '@digita-ai/handlersjs-http';
import {SignJWT, createLocalJWKSet, jwtVerify} from 'jose';
import {v4} from 'uuid';
import {JwksKeyHolder} from '../secrets/JwksKeyHolder';
import {parseModes} from '../util/modes/ModesParser';
import {isString} from '../util/StringGuard';
import {Ticket, TicketFactory} from './TicketFactory';


export interface JwtTicketParams {
    expirationTime: string | number,
}

/**
 * A UMA Ticket Factory using JWTs for tickets.
 */
export class JwtTicketFactory extends TicketFactory {
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
    const jwt = await new SignJWT({id: ticket.id, sub: ticket.sub.path, modes: [...ticket.requested]})
        .setProtectedHeader({alg: this.keyholder.getAlg(), kid})
        .setIssuedAt()
        .setIssuer(this.issuer)
        .setAudience(ticket.sub.pod)
        .setExpirationTime(this.params.expirationTime)
        .setJti(v4())
        .sign(this.keyholder.getPrivateKey(kid));
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
      });

      if (!payload.sub || !payload.aud || !payload.modes || !payload.id) {
        throw new Error('Missing JWT parameter(s): {sub, aud, modes, id} are required.');
      }
      if (Array.isArray(payload.aud)) {
        throw new Error('JWT audience should not be an array.');
      }
      if (!isString(payload.id)) {
        throw new Error('JWT claim "id" is not a string.');
      }
      if (!Array.isArray(payload.modes)) {
        throw new Error('JWT claim "modes" is not an array.');
      }

      return {sub: {path: payload.sub, pod: payload.aud}, id: payload.id, requested: parseModes(payload.modes)};
    } catch (error: any) {
      throw new BadRequestHttpError(`Invalid UMA Ticket provided, error while parsing: `+
      `${error.message}`);
    }
  }
}
