import {JwksKeyHolder} from '@laurensdeb/authorization-agent-uma';
import * as jose from 'jose';
import {v4} from 'uuid';

export interface DpopToken {
    dpop: string,
    token: string
}

export type Method = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD';

/**
 * Factory yielding Solid OIDC compliant JWTs that can be used in authentication
 */
export class SolidAuthnTokenFactory {
  private issuer: string;
  private dpopKeypair: {publicKey: jose.KeyLike, privateKey: jose.KeyLike} | undefined;
  /**
 * @param {JwksKeyHolder} keyholder Keyholder used in issuing JWTs
 * @param {string} baseUrl base URI of the Solid OIDC endpoint
 */
  constructor(private readonly keyholder: JwksKeyHolder, baseUrl: string) {
    this.issuer = `${baseUrl}/oidc`;
  }

  /**
   * Generates a new Dpop Keypair
   */
  private async generateDpopKeyPair() {
    this.dpopKeypair = await jose.generateKeyPair('ES256');
  }

  /**
   * For given parameters this method will yield and sign the
   * DPOP and Access Token that can be used in a request.
   *
   * @param {Method} method HTTP method
   * @param {string} uri HTTP endpoint on which a call is being made
   * @param {string} webId WebID of the authenticated client
   * @param {string} clientId ClientID for the authenticated session
   */
  public async getToken(method: Method, uri: string, webId: string, clientId: string): Promise<DpopToken> {
    const privateKey = this.keyholder.getPrivateKey(await this.keyholder.getDefaultKey());

    if (!this.dpopKeypair) {
      await this.generateDpopKeyPair();
    }

    const dpopPublicJwk = await jose.exportJWK(this.dpopKeypair?.publicKey!);

    const dpop = await new jose.SignJWT({'htu': uri, 'htm': method, 'jti': v4()})
        .setProtectedHeader({alg: 'ES256', typ: 'dpop+jwt',
          jwk: dpopPublicJwk})
        .setIssuedAt()
        .sign(this.dpopKeypair?.privateKey!);


    const token = await new jose.SignJWT({'azp': clientId, 'webid': webId,
      'cnf': {'jkt': await jose.calculateJwkThumbprint(dpopPublicJwk)}})
        .setProtectedHeader({alg: this.keyholder.getAlg(), typ: 'JWT'})
        .setAudience([clientId, 'solid'])
        .setSubject(webId)
        .setExpirationTime('15m')
        .setIssuedAt()
        .setIssuer(this.issuer)
        .setJti(v4())
        .sign(privateKey);

    return {dpop, token};
  }
}
