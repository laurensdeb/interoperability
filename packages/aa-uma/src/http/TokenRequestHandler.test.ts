import {GrantTypeProcessor, TokenRequestHandler, TokenResponse} from './TokenRequestHandler';
import {lastValueFrom} from 'rxjs';
import {BadRequestHttpError, HttpHandlerContext, UnsupportedMediaTypeHttpError} from '@digita-ai/handlersjs-http';

/**
 * Simple Mocking Grant Processor
 */
class MockGrantProcessor implements GrantTypeProcessor {
  /**
     * Get Supported Grant Type URI
     * @return {string} Supported grant type URI
     */
  public getSupportedGrantType(): string {
    return 'urn:ietf:params:oauth:grant-type:uma-ticket';
  }
  /**
     * Mocks successfull grant processing.
     *
     * @param {TokenRequest} body - request body
     * @param {HttpHandlerContext} context - request context
     * @return {Promise<TokenResponse>} tokens
     */
  public async process(body: Map<string, string>, context: HttpHandlerContext): Promise<TokenResponse> {
    return {token_type: 'Bearer', access_token: 'abc'};
  }
}

describe('Happy flows', () => {
  const requestHandler = new TokenRequestHandler([new MockGrantProcessor()]);
  let requestContext: HttpHandlerContext;

  beforeEach(() => {
    requestContext = {
      request: {
        url: new URL('http://localhost/token'),
        method: 'POST',
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Auma-ticket` +
        `&ticket=016f84e8-f9b9-11e0-bd6f-0021cc6004de` +
        `&claim_token=abc` +
        `&claim_token_format=http%3A%2F%2Fopenid.net%2Fspecs%2Fopenid-connect-core-1_0.html%23IDToken`,
        headers: {'content-type': 'application/x-www-form-urlencoded'},
      },
    };
  });

  test('Returns JWKS in response body', async () => {
    const response = await lastValueFrom(requestHandler.handle(requestContext));
    expect(response.body).toEqual(JSON.stringify({token_type: 'Bearer', access_token: 'abc'}));
    expect(response.status).toEqual(200);
  });
});

describe('Unhappy flows', () => {
  const requestHandler = new TokenRequestHandler([new MockGrantProcessor()]);

  test('Invalid media type', async () => {
    expect(() => requestHandler.handle({
      request: {
        url: new URL('http://localhost/token'),
        method: 'POST',
        headers: {'content-type': 'application/json'},
      },
    })).toThrow(UnsupportedMediaTypeHttpError);
  });
  test('Missing \'grant_type\' in body.', async () => {
    expect(() => requestHandler.handle({
      request: {
        url: new URL('http://localhost/token'),
        method: 'POST',
        body: ``,
        headers: {'content-type': 'application/x-www-form-urlencoded'},
      },
    })).toThrow(BadRequestHttpError);
  });
  test('Empty \'grant_type\' in body.', async () => {
    expect(() => requestHandler.handle({
      request: {
        url: new URL('http://localhost/token'),
        method: 'POST',
        body: `grant_type=`,
        headers: {'content-type': 'application/x-www-form-urlencoded'},
      },
    })).toThrow(BadRequestHttpError);
  });
  test('Unsupported \'grant_type\' in body.', async () => {
    expect(() => requestHandler.handle({
      request: {
        url: new URL('http://localhost/token'),
        method: 'POST',
        body: `grant_type=abc`,
        headers: {'content-type': 'application/x-www-form-urlencoded'},
      },
    })).toThrow('Unsupported grant type: \'abc\'');
  });
});
