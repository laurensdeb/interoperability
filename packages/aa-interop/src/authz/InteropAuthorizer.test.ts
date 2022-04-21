import {InteropAuthorizer} from './InteropAuthorizer';

const pod = 'https://pod.example.org/alice';
const webId = 'https://webid.example.org/alice/profile#me';
const clientId = 'https://app.example.org/id#it';
const path = '/resource/123.ttl';

describe('Happy flows', () => {
  const authorizer = new InteropAuthorizer();

  test('Should throw error', () => {
    expect(async () => await authorizer.authorize({webId, clientId}, {owner: webId, requested: new Set(),
      sub: {pod, path}})).rejects.toThrowError();
  });
});
