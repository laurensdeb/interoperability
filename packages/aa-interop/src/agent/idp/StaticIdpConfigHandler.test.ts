import {RoutePath} from '@laurensdeb/authorization-agent-helpers';
import {lastValueFrom} from 'rxjs';
import {StaticIdpConfigHandler} from './StaticIdpConfigHandler';

const BASE_URL = 'https://example.org';
describe('A StaticIdpConfigHandler', () => {
  const handler = new StaticIdpConfigHandler({
    issuer: new RoutePath(BASE_URL, '/idp'),
    jwks_uri: new RoutePath(BASE_URL, '/idp/keys'),
  });

  it('should return a configuration in compliance with the Solid OIDC specification', async () => {
    const res = await lastValueFrom(handler.handle({
      request: {
        url: new URL(`${BASE_URL}/idp/.well-known/openid-configuration`),
        method: 'GET',
        headers: {},
      },
    }));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toEqual('application/json');
    expect(JSON.parse(res.body)).toEqual({
      issuer: `${BASE_URL}/idp`,
      jwks_uri: `${BASE_URL}/idp/keys`,
      scopes_supported: ['webid'],
    });
  });
});
