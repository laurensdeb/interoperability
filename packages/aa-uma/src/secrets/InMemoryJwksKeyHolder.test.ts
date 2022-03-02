import {InMemoryJwksKeyHolder} from './InMemoryJwksKeyHolder';

describe('Testing on empty holder', () => {
  const keyholder = new InMemoryJwksKeyHolder('ES256');
  test('Empty holder should have no Key Ids', async () => {
    expect(keyholder.getKids()).toStrictEqual([]);
  });
  test('Empty holder should have empty JWKS', async () => {
    expect((await keyholder.getJwks()).keys).toStrictEqual([]);
  });
  test('Empty holder should throw error when retrieving private key', () => {
    expect(() => keyholder.getPrivateKey('abc'))
        .toThrowError('The specified kid \'abc\' does not exist in the holder.');
  });
  test('Empty holder should throw error when retrieving public key', () => {
    expect(() => keyholder.getPublicKey('abc'))
        .toThrowError('The specified kid \'abc\' does not exist in the holder.');
  });
  test('Empty holder should throw error when retrieving JWK', async () => {
    expect.assertions(1);
    try {
      await keyholder.toPublicJwk('abc');
    } catch (e:any) {
      expect(e.message).toEqual('The specified kid \'abc\' does not exist in the holder.');
    }
  });
});

describe('Validity of constructor arguments', () => {
  test('Unsupported algorithm should throw error', () => {
    expect(() => new InMemoryJwksKeyHolder('abc'))
        .toThrowError('The chosen algorithm \'abc\' is not supported by the InMemoryJwksKeyHolder.');
  });
});

describe('Testing operations on filled holder.', () => {
  const keyholder = new InMemoryJwksKeyHolder('ES256');
  let kid:string;

  test('Holder should return kid upon creation', async () => {
    kid = await keyholder.generateKeypair();
    expect(kid).toBeTruthy();
  });
  test('Holder should have one key ID', async () => {
    expect(keyholder.getKids()).toStrictEqual([kid]);
  });
  test('Holder should have one key in JWKS', async () => {
    expect((await keyholder.getJwks()).keys.length).toStrictEqual(1);
  });
  test('Holder should have public key', async () => {
    expect(keyholder.getPublicKey(kid)).toBeTruthy();
  });
  test('Holder should have private key', async () => {
    expect(keyholder.getPrivateKey(kid)).toBeTruthy();
  });
});
