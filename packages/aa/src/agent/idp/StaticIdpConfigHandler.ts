import {OAuthConfigRequestHandler, OAuthConfiguration, RoutePath} from '@thundr-be/sai-helpers';
import {Memoize} from 'typescript-memoize';

export interface StaticIdpArgs {
    /**
     * Base URI of the issuer, should provide an
     * OIDC Configuration at `${issuer.getUri()}.well-known/openid-configuration`
     */
    issuer: RoutePath,
    jwks_uri: RoutePath
}

/**
 * Implements static parts of a Solid OIDC IdP
 * in order to allow the Authorization Agent to
 * authenticate.
 */
export class StaticIdpConfigHandler extends OAuthConfigRequestHandler {
  /**
     * @param {StaticIdpArgs} args
     */
  constructor(private readonly args: StaticIdpArgs) {
    super();
  }
  /**
   * Return configuration for the static IdP
   * @return {OAuthConfiguration}
   */
  @Memoize()
  getConfig(): OAuthConfiguration {
    return {
      issuer: this.args.issuer.getUri(),
      jwks_uri: this.args.jwks_uri.getUri(),
      scopes_supported: ['webid'],
    };
  }
}
