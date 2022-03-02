import {UmaConfigRequestHandler} from './UmaConfigRequestHandler';
import {lastValueFrom} from 'rxjs';
import {HttpHandlerContext} from '@digita-ai/handlersjs-http';

describe('Happy flows', () => {
  const requestHandler = new UmaConfigRequestHandler();
  let requestContext: HttpHandlerContext;

  beforeEach(() => {
    requestContext = {
      request: {
        url: new URL('http://localhost/'),
        method: 'GET',
        headers: {},
      },
    };
  });

  test('Can handle any request', async () => {
    expect(await lastValueFrom(requestHandler.canHandle(requestContext))).toEqual(true);
  });
  test('Handles GET request with configuration in body', async () => {
    const response = await lastValueFrom(requestHandler.handle(requestContext));
    expect(response.body).toEqual(JSON.stringify({
      'jwks_uri': '/keys', 'grant_types_supported': [
        'urn:ietf:params:oauth:grant-type:uma-ticket',
      ],
    }));
    expect(response.status).toEqual(200);
  });
});

describe('Unhappy flows', () => {
  const requestHandler = new UmaConfigRequestHandler();
  let requestContext: HttpHandlerContext;

  beforeEach(() => {
    requestContext = {
      request: {
        url: new URL('http://localhost/'),
        method: 'POST',
        headers: {},
      },
    };
  });

  test('Error for unsupported method', async () => {
    const response = await lastValueFrom(requestHandler.handle(requestContext));
    expect(response.body).toBeFalsy();
    expect(response.status).toEqual(405);
    expect(response.headers).toEqual({allow: 'GET'});
  });
});
