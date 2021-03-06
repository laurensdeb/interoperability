import {getLoggerFor, JwksKeyHolder, RoutePath} from '@thundr-be/sai-helpers';
import {SignJWT, calculateJwkThumbprint, exportJWK} from 'jose';
import {v4} from 'uuid';
import {Client, DPoP, DpopBoundIdToken, DpopBoundTokenFactory} from './DpopBoundTokenFactory';

const SOLID = 'solid';

/**
 *
 */
export class SolidOidcTokenFactory extends DpopBoundTokenFactory {
  private readonly logger = getLoggerFor(this);
  /**
     * @param {JwksKeyHolder} keyholder
     */
  constructor(private readonly keyholder: JwksKeyHolder, private readonly issuer: RoutePath) {
    super();
  }

  /**
   * Returns a DPoP and jkt
   *
   * @param {string} htu - HTTP URI
   * @param {string} htm - HTTP Method
   */
  public async getDpop(htu: string, htm: string): Promise<DPoP> {
    const kid = await this.keyholder.getDefaultKey();
    const jwk = await exportJWK(this.keyholder.getPublicKey(kid));
    htu = htu.split('#')[0];
    const dpop = await new SignJWT({htu, htm})
        .setProtectedHeader({alg: this.keyholder.getAlg(), typ: 'dpop+jwt', jwk})
        .setIssuedAt()
        .setExpirationTime('1m')
        .setJti(v4())
        .sign(this.keyholder.getPrivateKey(kid));

    return {token: dpop, jkt: await calculateJwkThumbprint(jwk)};
  }

  /**
   * Returns a SolidOIDC compliant DPoP-bound JWT
   *
   * @param {string} uri - request URI
   * @param {string} method - HTTP Method
   * @param {Client} client - Client identifiers
   * @return {DpopBoundIdToken}
   */
  public async getToken(uri: string, method: string, client: Client): Promise<DpopBoundIdToken> {
    const kid = await this.keyholder.getDefaultKey();
    const dpop = await this.getDpop(uri, method);
    const jwt = await new SignJWT({...client, sub: client.webid, cnf: {jkt: dpop.jkt}})
        .setProtectedHeader({alg: this.keyholder.getAlg(), typ: 'JWT', kid})
        .setIssuedAt()
        .setIssuer(this.issuer.getUri())
        .setAudience([SOLID, client.azp])
        .setExpirationTime('1m')
        .setJti(v4())
        .sign(this.keyholder.getPrivateKey(kid));
    return {id_token: jwt, dpop: dpop.token};
  }
}
