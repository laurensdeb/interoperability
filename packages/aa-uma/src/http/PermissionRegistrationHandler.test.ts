import {BadRequestHttpError, HttpHandlerContext,
  UnauthorizedHttpError, UnsupportedMediaTypeHttpError} from '@digita-ai/handlersjs-http';
import {PermissionRegistrationHandler, RequestingPartyRegistration} from './PermissionRegistrationHandler';
import * as jose from 'jose';
import {lastValueFrom} from 'rxjs';

/*
 * Key Generation:
 * ===============
 *
 * openssl ecparam -name prime256v1 -genkey -noout -out private-key.pem
 * openssl pkcs8 -topk8 -nocrypt -in private-key.pem -out private-key-pkcs8.pem
 *
 * openssl ec -in private-key.pem -pubout -out public-key.pem
 */

const mockedTicketFactory = {
  serialize: jest.fn(),
  deserialize: jest.fn(),
};

const POD_URI = 'https://pod.example.org';
const MOCK_REGISTRATION : RequestingPartyRegistration = {
  baseUri: POD_URI,
  ecAlgorithm: 'ES256',
  ecPublicKey: `-----BEGIN PUBLIC KEY-----
  MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGJkzO34pMnTx4uxoTD0+dvB4gVaX
  s9X+qkguzUCNT9ZzbZ/onTZrvQDLVAdH++c7sS/vmfrNuACUeNhLr9aYFA==
  -----END PUBLIC KEY-----`,
};

const POD_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg/cteLEDr0AH+7mA3
lvCtf2pY32NMVpy2yWCk8LbfJ+WhRANCAAQYmTM7fikydPHi7GhMPT528HiBVpez
1f6qSC7NQI1P1nNtn+idNmu9AMtUB0f75zuxL++Z+s24AJR42Euv1pgU
-----END PRIVATE KEY----`;

const getJwt = async (ecPrivateKey: string, ecAlgorithm: string, iss: string, aud: string) => {
  const privateKey = await jose.importPKCS8(ecPrivateKey, ecAlgorithm);
  return await new jose.SignJWT({})
      .setProtectedHeader({alg: ecAlgorithm})
      .setIssuedAt()
      .setIssuer(iss)
      .setAudience(aud)
      .setExpirationTime('1m')
      .sign(privateKey);
};

const AS_URI = 'https://as.example.org';
const MOCK_TICKET = 'abcd';

describe('Happy flows', () => {
  const requestHandler = new PermissionRegistrationHandler(AS_URI, mockedTicketFactory, [MOCK_REGISTRATION]);
  let requestContext: HttpHandlerContext;

  beforeEach(async () => {
    mockedTicketFactory.serialize.mockResolvedValueOnce(MOCK_TICKET);
    requestContext = {
      request: {
        url: new URL('http://localhost/'),
        method: 'POST',
        headers: {'content-type': 'application/json',
          'authorization': `Bearer ${await getJwt(POD_PRIVATE_KEY, 'ES256', POD_URI, AS_URI)}`},
      },
    };
  });

  test('Returns ticket in response body', async () => {
    requestContext.request.body = {
      resource_set_id: '/example/123',
      scopes: ['http://www.w3.org/ns/auth/acl#Read'],
    };
    const response = await lastValueFrom(requestHandler.handle(requestContext));
    expect(mockedTicketFactory.serialize).toBeCalled();
    expect(response.status).toEqual(200);
    expect(response.body?.ticket).toEqual(MOCK_TICKET);
  });
});

describe('Unhappy flows', () => {
  const requestHandler = new PermissionRegistrationHandler(AS_URI, mockedTicketFactory, [MOCK_REGISTRATION]);
  let requestContext: HttpHandlerContext;

  beforeEach(async () => {
    mockedTicketFactory.serialize.mockResolvedValueOnce(MOCK_TICKET);
    requestContext = {
      request: {
        url: new URL('http://localhost/'),
        method: 'POST',
        headers: {'content-type': 'application/json',
          'authorization': `Bearer ${await getJwt(POD_PRIVATE_KEY, 'ES256', POD_URI, AS_URI)}`},
      },
    };
  });

  test('Invalid Authorization header should throw error', async () => {
    requestContext.request.headers['authorization'] = 'abc';
    requestContext.request.body = {
      resource_set_id: '/example/123',
      scopes: ['http://www.w3.org/ns/auth/acl#Read'],
    };
    expect(lastValueFrom(requestHandler.handle(requestContext))).rejects.toThrowError(BadRequestHttpError);
  });

  test('Missing Authorization header should throw error', async () => {
    delete requestContext.request.headers['authorization'];
    requestContext.request.body = {
      resource_set_id: '/example/123',
      scopes: ['http://www.w3.org/ns/auth/acl#Read'],
    };
    expect(lastValueFrom(requestHandler.handle(requestContext))).rejects.toThrowError(UnauthorizedHttpError);
  });

  test('Unregistered Signer Authorization header should throw error', async () => {
    requestContext.request.headers['authorization'] = 'Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdW' +
    'IiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.tyh-VfuzIxC' +
    'yGYDlkBA7DfyjrqmSHu6pQ2hoZuFqUSLPNY2N0mpHb3nk5K17HWP_3cYHBw7AhHale5wky6-sVA';
    requestContext.request.body = {
      resource_set_id: '/example/123',
      scopes: ['http://www.w3.org/ns/auth/acl#Read'],
    };
    expect(lastValueFrom(requestHandler.handle(requestContext))).rejects.toThrowError('Bearer token is invalid');
  });

  test('Missing key "resource_set_id" should throw error', async () => {
    requestContext.request.body = {
      scopes: ['http://www.w3.org/ns/auth/acl#Read'],
    };
    expect(lastValueFrom(requestHandler.handle(requestContext))).rejects.toThrowError(BadRequestHttpError);
  });

  test('Non-string key "resource_set_id" should throw error', async () => {
    requestContext.request.body = {
      resource_set_id: 123,
      scopes: ['http://www.w3.org/ns/auth/acl#Read'],
    };
    expect(lastValueFrom(requestHandler.handle(requestContext))).rejects.toThrowError(BadRequestHttpError);
  });

  test('Invalid "scopes" should throw error', async () => {
    requestContext.request.body = {
      resource_set_id: '/example/123',
      scopes: ['http://www.w3.org/ns/auth/acl#Teleport'],
    };
    expect(lastValueFrom(requestHandler.handle(requestContext))).rejects.toThrowError(BadRequestHttpError);
  });

  test('Missing key "scopes" should throw error', async () => {
    requestContext.request.body = {
      resource_set_id: '/example/123',
    };
    expect(lastValueFrom(requestHandler.handle(requestContext))).rejects.toThrowError(BadRequestHttpError);
  });

  test('Invalid key "scopes" should throw error', async () => {
    requestContext.request.body = {
      resource_set_id: '/example/123',
      scopes: 'abc',
    };
    expect(lastValueFrom(requestHandler.handle(requestContext))).rejects.toThrowError(BadRequestHttpError);
  });

  test('Missing request body should throw error', async () => {
    expect(lastValueFrom(requestHandler.handle(requestContext))).rejects.toThrowError(BadRequestHttpError);
  });

  test('Invalid media type should throw error', async () => {
    requestContext.request.headers['content-type'] = 'text/plain';
    expect(lastValueFrom(requestHandler.handle(requestContext))).rejects.toThrowError(UnsupportedMediaTypeHttpError);
  });
});