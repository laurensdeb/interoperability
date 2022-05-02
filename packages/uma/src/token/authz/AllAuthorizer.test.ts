import {AllAuthorizer} from './AllAuthorizer';
import {AccessMode} from '@thundr-be/sai-helpers';
import {Authorizer} from '@thundr-be/sai-interfaces';

const WEBID = 'https://example.com/profile/alice#me';
const CLIENT = 'https://projectapp.com';
const RESOURCE = 'https://pods.example.com/test/123.ttl';

test('It should grant all modes in constructor', async () => {
  const authorizer: Authorizer = new AllAuthorizer([AccessMode.read]);

  expect(await authorizer.authorize({webId: WEBID, clientId: CLIENT}, {
    requested: new Set<AccessMode>([AccessMode.read]), owner: WEBID,
    sub: {iri: RESOURCE}})).toEqual(new Set([AccessMode.read]));
});

test('It should grant all modes by default', async () => {
  const authorizer: Authorizer = new AllAuthorizer();

  expect(await authorizer.authorize({webId: WEBID, clientId: CLIENT}, {
    requested: new Set<AccessMode>([AccessMode.read]), owner: WEBID,
    sub: {iri: RESOURCE}})).toEqual(
      new Set([AccessMode.read, AccessMode.write, AccessMode.create, AccessMode.delete, AccessMode.append]));
});
