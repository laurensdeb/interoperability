import {BadRequestHttpError} from '@digita-ai/handlersjs-http';
import {Logger, getLoggerFor} from '@laurensdeb/authorization-agent-helpers';
import {createLocalJWKSet, jwtVerify, SignJWT} from 'jose';
import {v4} from 'uuid';
import {JwksKeyHolder} from '@laurensdeb/authorization-agent-helpers';
import {parseModes} from '@laurensdeb/authorization-agent-helpers';
import {isString} from '../util/StringGuard';
import {SerializedToken, TokenFactory} from './TokenFactory';
import {AccessToken} from '@laurensdeb/authorization-agent-interfaces';

const AUD = 'solid';

export interface JwtTokenParams {
    expirationTime: string | number
    aud: string
}

/**
 * A TokenFactory yielding its tokens as signed JWTs.
 */
export class JwtTokenFactory extends TokenFactory {
  protected readonly logger: Logger = getLoggerFor(this);

  /**
     * Construct a new ticket factory
     * @param {JwksKeyHolder} keyholder - keyholder to be used in issuance
     */
  constructor(private readonly keyholder: JwksKeyHolder, private readonly issuer: string,
    private readonly params: JwtTokenParams = {expirationTime: '30m', aud: 'solid'}) {
    super();
  }

  /**
     * Serializes an Access Token into a JWT
     * @param {AccessTokentoken} token - authenticated and authorized principal
     * @return {Promise<SerializedToken>} - access token response
     */
  public async serialize(token: AccessToken): Promise<SerializedToken> {
    const kid = await this.keyholder.getDefaultKey();
    const jwt = await new SignJWT({webid: token.webId, azp: token.clientId?token.clientId:'http://www.w3.org/ns/auth/acl#Origin', modes: [...token.modes],
      sub: token.sub.iri})
        .setProtectedHeader({alg: this.keyholder.getAlg(), kid})
        .setIssuedAt()
        .setIssuer(this.issuer)
        .setAudience(AUD)
        .setExpirationTime(this.params.expirationTime)
        .setJti(v4())
        .sign(this.keyholder.getPrivateKey(kid));
    this.logger.debug('Issued new JWT Token', token);
    return {token: jwt, tokenType: 'Bearer'};
  }

  /**
   * Deserializes a JWT into an Access Token
   * @param {string} token - JWT access token
   * @return {Promise<AccessToken>} - deserialized access token
   */
  public async deserialize(token: string): Promise<AccessToken> {
    const jwks = createLocalJWKSet(await this.keyholder.getJwks());
    try {
      const {payload} = await jwtVerify(token, jwks, {
        issuer: this.issuer,
        audience: AUD,
      });

      if (!payload.sub || !payload.aud || !payload.modes || !payload.azp || !payload.webid) {
        throw new Error('Missing JWT parameter(s): {sub, aud, modes, webid, azp} are required.');
      }
      if (!isString(payload.webid)) {
        throw new Error('JWT claim "webid" is not a string.');
      }
      if (!isString(payload.azp)) {
        throw new Error('JWT claim "azp" is not a string.');
      }
      if (!Array.isArray(payload.modes)) {
        throw new Error('JWT claim "modes" is not an array.');
      }

      return {webId: payload.webid!, clientId: payload.azp!, sub: {iri: payload.sub},
        modes: parseModes(payload.modes)};
    } catch (error: any) {
      const msg = `Invalid Access Token provided, error while parsing: ${error.message}`;
      this.logger.debug(msg);
      throw new BadRequestHttpError(msg);
    }
  }
}
