import {OAuthConfigRequestHandler, OAuthConfiguration, ResponseType} from '@laurensdeb/authorization-agent-uma';
import {ASYMMETRIC_CRYPTOGRAPHIC_ALGORITHM}
  from '@solid/access-token-verifier/dist/constant/ASYMMETRIC_CRYPTOGRAPHIC_ALGORITHM';

export type OidcConfiguration = OAuthConfiguration & {
  claims_supported: string[]
}

/**
 *
 */
export class SolidOidcAuthnConfigHandler extends OAuthConfigRequestHandler<OidcConfiguration> {
  /**
   * Returns Solid OIDC Configuration for the AS
   * @return {UmaConfiguration} - AS Configuration
   */
  public getConfig(): OidcConfiguration {
    return {
      jwks_uri: `${this.baseUrl}/oidc/keys`,
      grant_types_supported: [],
      claims_supported: ['sub', 'webid', 'iss', 'aud'],
      issuer: `${this.baseUrl}/oidc`,
      dpop_signing_alg_values_supported: [...ASYMMETRIC_CRYPTOGRAPHIC_ALGORITHM],
      scopes_supported: ['openid', 'offline_access', 'webid'],
      response_types_supported: [ResponseType.Token],
    };
  }
}
