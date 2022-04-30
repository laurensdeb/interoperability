import {JwksKeyHolder, RoutePath} from '@laurensdeb/authorization-agent-helpers';
import {SolidOidcTokenFactory} from './SolidOidcTokenFactory';
import {generateKeyPair, decodeProtectedHeader, jwtVerify, importJWK, calculateJwkThumbprint, GenerateKeyPairResult, exportJWK} from 'jose';

const ALG = 'ES256';
const BASE_URL = 'https://example.org';
const IDP_PATH = '/idp';

const MOCK_REQUEST_URI = 'https://example.org';
const MOCK_AGENT = 'https://example.org/profile';
const MOCK_METHOD = 'GET';

const MOCK_KEYHOLDER = {
  getPublicKey: jest.fn(),
  getPrivateKey: jest.fn(),
  getDefaultKey: jest.fn(),
  getAlg: () => ALG,
};

describe('A SolidOidcTokenFactory', () => {
  const tokenFactory = new SolidOidcTokenFactory((MOCK_KEYHOLDER as unknown as JwksKeyHolder),
      new RoutePath(BASE_URL, IDP_PATH));
  let keys: GenerateKeyPairResult;
  afterEach(() => {
    jest.resetAllMocks();
  });
  beforeEach(async () => {
    keys = await generateKeyPair(ALG);
    MOCK_KEYHOLDER.getDefaultKey.mockResolvedValue('123');
    MOCK_KEYHOLDER.getPrivateKey.mockReturnValue(keys.privateKey);
    MOCK_KEYHOLDER.getPublicKey.mockReturnValue(keys.publicKey);
  });
  it('should generate a specification-compliant DPoP', async () => {
    const res = await tokenFactory.getDpop(MOCK_REQUEST_URI, MOCK_METHOD);
    expect(res).toBeTruthy();

    const decoded = await decodeProtectedHeader(res.token);
    expect(decoded.alg).toEqual(ALG);
    expect(decoded.typ).toEqual('dpop+jwt');
    expect(decoded.jwk).toBeDefined();

    const parsed = await jwtVerify(res.token, await importJWK(decoded.jwk!, ALG), {});
    expect(parsed.payload.iat).toBeDefined();
    expect(parsed.payload.exp).toBeDefined();
    expect(parsed.payload.jti).toBeDefined();
    expect(parsed.payload.htu).toEqual(MOCK_REQUEST_URI);
    expect(parsed.payload.htm).toEqual(MOCK_METHOD);

    expect(res.jkt).toEqual(await calculateJwkThumbprint(decoded.jwk!));
  });

  it('should generate a specification-compliant DPoP-bound JWT', async () => {
    const res = await tokenFactory.getToken(MOCK_REQUEST_URI, MOCK_METHOD, {webid: MOCK_AGENT, azp: MOCK_AGENT});
    expect(res.id_token).toBeTruthy();
    expect(res.dpop).toBeTruthy();

    const verified = await jwtVerify(res.id_token, keys.publicKey, {
      audience: ['solid', MOCK_AGENT],
      issuer: `${BASE_URL}${IDP_PATH}`,
    });

    expect(verified.protectedHeader.typ).toEqual('JWT');
    expect(verified.protectedHeader.alg).toEqual(ALG);

    expect(verified.payload.webid).toEqual(MOCK_AGENT);
    expect(verified.payload.iat).toBeDefined();
    expect(verified.payload.exp).toBeDefined();
    expect(verified.payload.sub).toEqual(MOCK_AGENT);
    expect(verified.payload.azp).toEqual(MOCK_AGENT);
    expect(verified.payload.cnf).toBeDefined();
    expect((verified.payload.cnf as any).jkt).toEqual(await calculateJwkThumbprint(await exportJWK(keys.publicKey)));

    const decoded = await decodeProtectedHeader(res.dpop);
    expect(decoded.alg).toEqual(ALG);
    expect(decoded.typ).toEqual('dpop+jwt');
    expect(decoded.jwk).toBeDefined();

    const parsed = await jwtVerify(res.dpop, await importJWK(decoded.jwk!, ALG), {});
    expect(parsed.payload.iat).toBeDefined();
    expect(parsed.payload.exp).toBeDefined();
    expect(parsed.payload.jti).toBeDefined();
    expect(parsed.payload.htu).toEqual(MOCK_REQUEST_URI);
    expect(parsed.payload.htm).toEqual(MOCK_METHOD);

    expect((verified.payload.cnf as any).jkt).toEqual(await calculateJwkThumbprint(decoded.jwk!));
  });
});
