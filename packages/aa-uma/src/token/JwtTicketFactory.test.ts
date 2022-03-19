import {InMemoryJwksKeyHolder} from '../secrets/InMemoryJwksKeyHolder';
import {JwtTicketFactory} from './JwtTicketFactory';
import {TicketFactory} from './TicketFactory';
import {AccessMode} from '../util/modes/AccessModes';
import {decodeJwt, decodeProtectedHeader, generateKeyPair, JWTPayload, KeyLike, SignJWT} from 'jose';
import {BadRequestHttpError} from '@digita-ai/handlersjs-http';
import {v4} from 'uuid';

const ISSUER = 'https://example.com';
const POD = 'https://pods.example.com/';

describe('Serialization tests', () => {
  const keyholder = new InMemoryJwksKeyHolder('ES256');
  const ticketFactory: TicketFactory = new JwtTicketFactory(keyholder, ISSUER);

  test('Should yield JWT for ticket', async () => {
    const jwt = await ticketFactory.serialize({id: 'abc', sub: {path: 'test/123.ttl', pod: POD},
      requested: new Set([AccessMode.read, AccessMode.write])});

    expect(jwt).toBeTruthy();
    expect(decodeProtectedHeader(jwt)).toEqual({alg: 'ES256', kid: await keyholder.getDefaultKey()});
    const payload = decodeJwt(jwt);

    expect(payload).toBeTruthy();
    expect('sub' in payload).toBeTruthy();
    expect('aud' in payload).toBeTruthy();
    expect('modes' in payload).toBeTruthy();
    expect('iss' in payload).toBeTruthy();
    expect('id' in payload).toBeTruthy();
    expect('jti' in payload).toBeTruthy();

    expect(payload.iss).toEqual(ISSUER);
    expect(payload.aud).toEqual(POD);

    expect(payload.modes).toEqual(['http://www.w3.org/ns/auth/acl#Read', 'http://www.w3.org/ns/auth/acl#Write']);
    expect(payload.id).toEqual('abc');
    expect(payload.sub).toEqual('test/123.ttl');
  });
});

describe('Deserialization tests', () => {
  const keyholder = new InMemoryJwksKeyHolder('ES256');
  const ticketFactory: TicketFactory = new JwtTicketFactory(keyholder, ISSUER);

  test('E2E', async () => {
    const ticket = {id: 'abc', sub: {path: 'test/123.ttl', pod: 'https://pods.example.com/'}, requested: new Set([AccessMode.read, AccessMode.write, AccessMode.create, AccessMode.append, AccessMode.delete])};
    const jwt = await ticketFactory.serialize(ticket);

    expect(await ticketFactory.deserialize(jwt)).toEqual(ticket);
  });

  test('Invalid JWT should throw error', async () => {
    expect(async () => await ticketFactory.deserialize('abc')).rejects.toThrow(BadRequestHttpError);
  });

  test('Invalid Signature should throw error', async () => {
    const key = await generateKeyPair('ES256');
    const jwt = await createJwt({id: 'abc', sub: 'test/123.ttl', modes: [AccessMode.read]}, key.privateKey);

    expect(async () => await ticketFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await ticketFactory.deserialize(jwt)).rejects
        .toThrow('Invalid UMA Ticket provided, error while parsing: signature verification failed');
  });

  test('Missing payload claim `id` should throw error', async () => {
    const jwt = await createJwt({sub: 'test/123.ttl', modes: [AccessMode.read], aud: POD},
        keyholder.getPrivateKey(await keyholder.getDefaultKey()));

    expect(async () => await ticketFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await ticketFactory.deserialize(jwt)).rejects
        .toThrow('Invalid UMA Ticket provided, error while parsing:' +
        ' Missing JWT parameter(s): {sub, aud, modes, id} are required.');
  });

  test('Missing payload claim `sub` should throw error', async () => {
    const jwt = await createJwt({id: 'abc', modes: [AccessMode.read], aud: POD},
        keyholder.getPrivateKey(await keyholder.getDefaultKey()));

    expect(async () => await ticketFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await ticketFactory.deserialize(jwt)).rejects
        .toThrow('Invalid UMA Ticket provided, error while parsing:' +
        ' Missing JWT parameter(s): {sub, aud, modes, id} are required.');
  });

  test('Missing payload claim `modes` should throw error', async () => {
    const jwt = await createJwt({id: 'abc', sub: 'test/123.ttl', aud: POD},
        keyholder.getPrivateKey(await keyholder.getDefaultKey()));

    expect(async () => await ticketFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await ticketFactory.deserialize(jwt)).rejects
        .toThrow('Invalid UMA Ticket provided, error while parsing:' +
        ' Missing JWT parameter(s): {sub, aud, modes, id} are required.');
  });

  test('Missing payload claim `aud` should throw error', async () => {
    const jwt = await createJwt({id: 'abc', sub: 'test/123.ttl', modes: [AccessMode.read]},
        keyholder.getPrivateKey(await keyholder.getDefaultKey()));
    expect(async () => await ticketFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await ticketFactory.deserialize(jwt)).rejects
        .toThrow('Invalid UMA Ticket provided, error while parsing:' +
        ' Missing JWT parameter(s): {sub, aud, modes, id} are required.');
  });

  test('Array payload claim `aud` should throw error', async () => {
    const jwt = await createJwt({id: 'abc', sub: 'test/123.ttl', modes: [AccessMode.read], aud: ['abc', 'def']},
        keyholder.getPrivateKey(await keyholder.getDefaultKey()));
    expect(async () => await ticketFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await ticketFactory.deserialize(jwt)).rejects
        .toThrow('Invalid UMA Ticket provided, error while parsing:' +
        ' JWT audience should not be an array.');
  });

  test('Non-string payload claim `id` should throw error', async () => {
    const jwt = await createJwt({id: 123, sub: 'test/123.ttl', modes: [AccessMode.read], aud: POD},
        keyholder.getPrivateKey(await keyholder.getDefaultKey()));
    expect(async () => await ticketFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await ticketFactory.deserialize(jwt)).rejects
        .toThrow('Invalid UMA Ticket provided, error while parsing:' +
        ' JWT claim "id" is not a string.');
  });

  test('Non-array payload claim `modes` should throw error', async () => {
    const jwt = await createJwt({id: 'abc', sub: 'test/123.ttl', modes: 123, aud: POD},
        keyholder.getPrivateKey(await keyholder.getDefaultKey()));
    expect(async () => await ticketFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await ticketFactory.deserialize(jwt)).rejects
        .toThrow('Invalid UMA Ticket provided, error while parsing:' +
        ' JWT claim "modes" is not an array.');
  });

  test('Invalid mode in claim `modes` should throw error', async () => {
    const jwt = await createJwt({id: 'abc', sub: 'test/123.ttl', modes: [AccessMode.read, 'abc'], aud: POD},
        keyholder.getPrivateKey(await keyholder.getDefaultKey()));
    expect(async () => await ticketFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await ticketFactory.deserialize(jwt)).rejects
        .toThrow('Invalid UMA Ticket provided, error while parsing:' +
        ' Invalid access mode: abc.');
  });

  test('Invalid mode in claim `modes` should throw error', async () => {
    const jwt = await createJwt({id: 'abc', sub: 'test/123.ttl', modes: [AccessMode.read, 123], aud: POD},
        keyholder.getPrivateKey(await keyholder.getDefaultKey()));
    expect(async () => await ticketFactory.deserialize(jwt)).rejects.toThrow(BadRequestHttpError);
    expect(async () => await ticketFactory.deserialize(jwt)).rejects
        .toThrow('Invalid UMA Ticket provided, error while parsing:' +
        ' Invalid access mode: 123');
  });
});

const createJwt = async (payload: JWTPayload, key: KeyLike, issuer: string = ISSUER) => {
  return await new SignJWT(payload)
      .setProtectedHeader({alg: 'ES256'})
      .setIssuedAt()
      .setIssuer(issuer)
      .setExpirationTime('30m')
      .setJti(v4())
      .sign(key);
};
