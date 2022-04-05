import {ASYMMETRIC_CRYPTOGRAPHIC_ALGORITHM}
  from '@solid/access-token-verifier/dist/constant/ASYMMETRIC_CRYPTOGRAPHIC_ALGORITHM';
import {OAuthConfigRequestHandler, OAuthConfiguration, ResponseType} from './OAuthConfigRequestHandler';


export type UmaConfiguration = OAuthConfiguration & {uma_profiles_supported?: string[]};

/**
 * An HttpHandler used for returning the configuration
 * of the UMA Authorization Service.
 */
export class UmaConfigRequestHandler extends OAuthConfigRequestHandler<UmaConfiguration> {
  /**
   * Returns UMA Configuration for the AS
   * @return {UmaConfiguration} - AS Configuration
   */
  public getConfig(): UmaConfiguration {
    return {
      jwks_uri: `${this.baseUrl}/uma/keys`,
      token_endpoint: `${this.baseUrl}/uma/token`,
      grant_types_supported: ['urn:ietf:params:oauth:grant-type:uma-ticket'],
      issuer: `${this.baseUrl}/uma`,
      uma_profiles_supported: ['http://openid.net/specs/openid-connect-core-1_0.html#IDToken'],
      dpop_signing_alg_values_supported: [...ASYMMETRIC_CRYPTOGRAPHIC_ALGORITHM],
      response_types_supported: [ResponseType.Token],
    };
  }
}
