import {InMemoryJwksKeyHolder} from '../secrets/InMemoryJwksKeyHolder';
import {TokenFactory} from './TokenFactory';
import {JwtTokenFactory} from './JwtTokenFactory';
import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {decodeJwt, decodeProtectedHeader, generateKeyPair, JWTPayload, KeyLike, SignJWT} from 'jose';
import {BadRequestHttpError} from '@digita-ai/handlersjs-http';
import {v4} from 'uuid';

const ISSUER = 'https://example.com';
const POD = 'https://pods.example.com/';
const WEBID = 'https://example.com/profile/alice#me';
const CLIENT = 'https://projectapp.com';
const PATH = 'test/123.ttl';
const ALG = 'ES256';

describe('JWT Access Token Issuance', () => {
  const keyholder = new InMemoryJwksKeyHolder(ALG);
  const tokenFactory: TokenFactory = new JwtTokenFactory(keyholder, ISSUER);

  test('Should yield JWT for access token', async () => {
    const accessToken = await tokenFactory.serialize({webId: WEBID, clientId: CLIENT, sub: {path: PATH, pod: POD},
      modes: new Set([AccessMode.read, AccessMode.write])});

    expect(accessToken.token).toBeTruthy();
    expect(decodeProtectedHeader(accessToken.token)).toEqual({alg: ALG, kid: await keyholder.getDefaultKey()});
    const payload = decodeJwt(accessToken.token);

    expect(payload).toBeTruthy();
    expect('sub' in payload).toBeTruthy();
    expect('aud' in payload).toBeTruthy();
    expect('modes' in payload).toBeTruthy();
    expect('webid' in payload).toBeTruthy();
    expect('azp' in payload).toBeTruthy();
    expect('iss' in payload).toBeTruthy();
    expect('jti' in payload).toBeTruthy();

    expect(payload.iss).toEqual(ISSUER);
    expect(payload.aud).toEqual(POD);

    expect(payload.modes).toEqual(['http://www.w3.org/ns/auth/acl#Read', 'http://www.w3.org/ns/auth/acl#Write']);
    expect(payload.webid).toEqual(WEBID);
    expect(payload.azp).toEqual(CLIENT);
    expect(payload.sub).toEqual(PATH);
  });
});

describe('Deserialization tests', () => {
  const keyholder = new InMemoryJwksKeyHolder(ALG);
  const tokenFactory: TokenFactory = new JwtTokenFactory(keyholder, ISSUER);

  test('E2E', async () => {
    const accessToken = {webId: WEBID, clientId: CLIENT, sub: {path: PATH, pod: POD},
      modes: new Set([AccessMode.read, AccessMode.write, AccessMode.create, AccessMode.append, AccessMode.delete])};
    const jwt = (await tokenFactory.serialize(accessToken)).token;

    expect(await tokenFactory.deserialize(jwt)).toEqual(accessToken);
  });

  test('Invalid JWT should throw error', async () => {
    expect(async () => await tokenFactory.deserialize('abc')).rejects.toThrow(BadRequestHttpError);
  });

  test('Invalid Signature should throw error', async () => {
    const key = await generateKeyPair(ALG);
    const jwt = await createJwt({}, key.privateKey);

    expect(async () => await tokenFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await tokenFactory.deserialize(jwt)).rejects
        .toThrow('Invalid Access Token provided, error while parsing: signature verification failed');
  });

  test('Missing payload claim `webid` should throw error', async () => {
    const jwt = await createJwt({azp: CLIENT, sub: PATH, aud: POD,
      modes: new Set([AccessMode.read, AccessMode.write, AccessMode.create, AccessMode.append, AccessMode.delete])},
    keyholder.getPrivateKey(await keyholder.getDefaultKey()));

    expect(async () => await tokenFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await tokenFactory.deserialize(jwt)).rejects
        .toThrow('Invalid Access Token provided, error while parsing:' +
        ' Missing JWT parameter(s): {sub, aud, modes, webid, azp} are required.');
  });

  test('Missing payload claim `azp` should throw error', async () => {
    const jwt = await createJwt({webid: WEBID, sub: PATH, aud: POD,
      modes: new Set([AccessMode.read, AccessMode.write, AccessMode.create, AccessMode.append, AccessMode.delete])},
    keyholder.getPrivateKey(await keyholder.getDefaultKey()));

    expect(async () => await tokenFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await tokenFactory.deserialize(jwt)).rejects
        .toThrow('Invalid Access Token provided, error while parsing:' +
        ' Missing JWT parameter(s): {sub, aud, modes, webid, azp} are required.');
  });

  test('Missing payload claim `sub` should throw error', async () => {
    const jwt = await createJwt({webid: WEBID, azp: CLIENT, aud: POD,
      modes: new Set([AccessMode.read, AccessMode.write, AccessMode.create, AccessMode.append, AccessMode.delete])},
    keyholder.getPrivateKey(await keyholder.getDefaultKey()));

    expect(async () => await tokenFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await tokenFactory.deserialize(jwt)).rejects
        .toThrow('Invalid Access Token provided, error while parsing:' +
        ' Missing JWT parameter(s): {sub, aud, modes, webid, azp} are required.');
  });

  test('Missing payload claim `aud` should throw error', async () => {
    const jwt = await createJwt({webid: WEBID, azp: CLIENT, sub: PATH,
      modes: new Set([AccessMode.read, AccessMode.write, AccessMode.create, AccessMode.append, AccessMode.delete])},
    keyholder.getPrivateKey(await keyholder.getDefaultKey()));

    expect(async () => await tokenFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await tokenFactory.deserialize(jwt)).rejects
        .toThrow('Invalid Access Token provided, error while parsing:' +
        ' Missing JWT parameter(s): {sub, aud, modes, webid, azp} are required.');
  });

  test('Missing payload claim `modes` should throw error', async () => {
    const jwt = await createJwt({webid: WEBID, azp: CLIENT, sub: PATH, aud: POD},
        keyholder.getPrivateKey(await keyholder.getDefaultKey()));

    expect(async () => await tokenFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await tokenFactory.deserialize(jwt)).rejects
        .toThrow('Invalid Access Token provided, error while parsing:' +
        ' Missing JWT parameter(s): {sub, aud, modes, webid, azp} are required.');
  });

  test('Array payload claim `aud` should throw error', async () => {
    const jwt = await createJwt({webid: WEBID, azp: CLIENT, sub: PATH, aud: ['abc', 'def'],
      modes: new Set([AccessMode.read, AccessMode.write, AccessMode.create, AccessMode.append, AccessMode.delete])},
    keyholder.getPrivateKey(await keyholder.getDefaultKey()));
    expect(async () => await tokenFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await tokenFactory.deserialize(jwt)).rejects
        .toThrow('Invalid Access Token provided, error while parsing:' +
        ' JWT audience should not be an array.');
  });

  test('Non-string claim `webid` should throw error', async () => {
    const jwt = await createJwt({webid: 123, azp: CLIENT, sub: PATH, aud: POD,
      modes: new Set([AccessMode.read, AccessMode.write, AccessMode.create, AccessMode.append, AccessMode.delete])},
    keyholder.getPrivateKey(await keyholder.getDefaultKey()));
    expect(async () => await tokenFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await tokenFactory.deserialize(jwt)).rejects
        .toThrow('Invalid Access Token provided, error while parsing:' +
        ' JWT claim "webid" is not a string.');
  });
  test('Non-array claim `modes` should throw error', async () => {
    const jwt = await createJwt({webid: WEBID, azp: CLIENT, sub: PATH, aud: POD,
      modes: 123},
    keyholder.getPrivateKey(await keyholder.getDefaultKey()));
    expect(async () => await tokenFactory.deserialize(jwt)).rejects
        .toThrow('Invalid Access Token provided, error while parsing:' +
        ' JWT claim "modes" is not an array.');
  });

  test('Non-string claim `azp` should throw error', async () => {
    const jwt = await createJwt({webid: WEBID, azp: 123, sub: PATH, aud: POD,
      modes: new Set([AccessMode.read, AccessMode.write, AccessMode.create, AccessMode.append, AccessMode.delete])},
    keyholder.getPrivateKey(await keyholder.getDefaultKey()));
    expect(async () => await tokenFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await tokenFactory.deserialize(jwt)).rejects
        .toThrow('Invalid Access Token provided, error while parsing:' +
        ' JWT claim "azp" is not a string.');
  });
});

describe('Test anonymous client', () => {
  const keyholder = new InMemoryJwksKeyHolder(ALG);
  const tokenFactory: TokenFactory = new JwtTokenFactory(keyholder, ISSUER);

  test('Should yield JWT for access token', async () => {
    const accessToken = await tokenFactory.serialize({webId: WEBID, sub: {path: PATH, pod: POD},
      modes: new Set([AccessMode.read, AccessMode.write])});

    expect(accessToken.token).toBeTruthy();
    expect(decodeProtectedHeader(accessToken.token)).toEqual({alg: ALG, kid: await keyholder.getDefaultKey()});
    const payload = decodeJwt(accessToken.token);

    expect(payload).toBeTruthy();
    expect('sub' in payload).toBeTruthy();
    expect('aud' in payload).toBeTruthy();
    expect('modes' in payload).toBeTruthy();
    expect('webid' in payload).toBeTruthy();
    expect('azp' in payload).toBeTruthy();
    expect('iss' in payload).toBeTruthy();
    expect('jti' in payload).toBeTruthy();

    expect(payload.iss).toEqual(ISSUER);
    expect(payload.aud).toEqual(POD);

    expect(payload.modes).toEqual(['http://www.w3.org/ns/auth/acl#Read', 'http://www.w3.org/ns/auth/acl#Write']);
    expect(payload.webid).toEqual(WEBID);
    expect(payload.azp).toEqual('http://www.w3.org/ns/auth/acl#Origin');
    expect(payload.sub).toEqual(PATH);
  });
});

const createJwt = async (payload: JWTPayload, key: KeyLike, issuer: string = ISSUER) => {
  return await new SignJWT(payload)
      .setProtectedHeader({alg: ALG})
      .setIssuedAt()
      .setIssuer(issuer)
      .setExpirationTime('30m')
      .setJti(v4())
      .sign(key);
};


