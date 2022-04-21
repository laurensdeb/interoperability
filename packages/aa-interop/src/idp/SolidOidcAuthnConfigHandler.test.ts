import {lastValueFrom} from 'rxjs';
import {HttpHandlerContext} from '@digita-ai/handlersjs-http';
import {SolidOidcAuthnConfigHandler} from './SolidOidcAuthnConfigHandler';

const BASE_URL = 'https://example.org';

describe('Happy flows', () => {
  const requestHandler = new SolidOidcAuthnConfigHandler(BASE_URL);
  let requestContext: HttpHandlerContext;

  beforeEach(() => {
    requestContext = {
      request: {
        url: new URL(BASE_URL),
        method: 'GET',
        headers: {},
      },
    };
  });
  test('Handles GET request with configuration in body', async () => {
    const response = await lastValueFrom(requestHandler.handle(requestContext));
    expect(JSON.parse(response.body)).toEqual({
      'jwks_uri': `${BASE_URL}/oidc/keys`,
      'grant_types_supported': [
      ],
      'dpop_signing_alg_values_supported': [
        'ES256',
        'ES384',
        'ES512',
        'PS256',
        'PS384',
        'PS512',
        'RS256',
        'RS384',
        'RS512',
      ],
      'scopes_supported': ['openid', 'offline_access', 'webid'],
      'claims_supported': ['sub', 'webid', 'iss', 'aud'],
      'issuer': 'https://example.org/oidc',
      'response_types_supported': [
        'token',
      ],
    });
    expect(response.status).toEqual(200);
  });
});
