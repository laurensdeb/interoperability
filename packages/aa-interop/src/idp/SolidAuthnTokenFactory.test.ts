import {SolidAuthnTokenFactory} from './SolidAuthnTokenFactory';
import * as jose from 'jose';

const mockJwksKeyholder = {
  getPublicKey: jest.fn(),
  getPrivateKey: jest.fn(),
  getDefaultKey: jest.fn(),
  toPublicJwk: jest.fn(),
  getJwks: jest.fn(),
  getKids: jest.fn(),
  generateKeypair: jest.fn(),
  getAlg: () => 'ES256',
};

const HTU = 'https://pods.example.org/123';
const HTM = 'GET';
const webId = 'https://webid.example.org/alice#me';
const clientId = 'https://app.example.org/id#it';
const baseUrl = 'https://example.org';

let testingKeypair: {publicKey: jose.KeyLike, privateKey: jose.KeyLike} | undefined;

describe('Happy Flows', () => {
  const tokenFactory: SolidAuthnTokenFactory = new SolidAuthnTokenFactory(mockJwksKeyholder, baseUrl);

  beforeEach(async () => {
    mockJwksKeyholder.getDefaultKey.mockReturnValue('abc');
    testingKeypair = await jose.generateKeyPair('ES256');
    mockJwksKeyholder.getPrivateKey.mockReturnValue(testingKeypair.privateKey);
  });

  test('Should yield token conformant to the specification.', async () => {
    const token = await tokenFactory.getToken(HTM, HTU, webId, clientId);
    expect(token).toBeTruthy();
    expect(token.dpop).toBeTruthy();
    expect(token.token).toBeTruthy();

    const dpopHeader = jose.decodeProtectedHeader(token.dpop);
    expect(dpopHeader.typ).toEqual('dpop+jwt');
    expect(dpopHeader.jwk).toBeTruthy();

    const dpopClaims = jose.decodeJwt(token.dpop);
    expect(dpopClaims.htu).toEqual(HTU);
    expect(dpopClaims.htm).toEqual(HTM);
    expect(dpopClaims.jti).toBeTruthy();
    expect(dpopClaims.iat).toBeTruthy();

    const dpopJwkThumbprint = await jose.calculateJwkThumbprint(dpopHeader.jwk!);

    const idTokenHeader = jose.decodeProtectedHeader(token.token);
    expect(idTokenHeader.typ).toEqual('JWT');

    const idTokenClaims = jose.decodeJwt(token.token);
    expect(idTokenClaims['cnf']).toBeTruthy();
    expect((idTokenClaims['cnf'] as any)['jkt']).toEqual(dpopJwkThumbprint);
    expect(idTokenClaims.sub).toEqual(webId);
    expect(idTokenClaims.webid).toEqual(webId);
    expect(idTokenClaims.azp).toEqual(clientId);

    expect(idTokenClaims.aud).toContainEqual('solid');
    expect(idTokenClaims.aud).toContainEqual(clientId);

    expect(idTokenClaims.iss).toEqual(`${baseUrl}/oidc`);

    expect(idTokenClaims.jti).toBeTruthy();
    expect(idTokenClaims.iat).toBeTruthy();
    expect(idTokenClaims.exp).toBeGreaterThanOrEqual(idTokenClaims.iat!);

    // Verify DPoP signature
    const JWKS = jose.createLocalJWKSet({
      keys: [
        dpopHeader.jwk!,
      ],
    });

    await jose.jwtVerify(token.dpop, JWKS);

    // Verify ID Token signature
    await jose.jwtVerify(token.token, testingKeypair?.publicKey!);
  });
});
