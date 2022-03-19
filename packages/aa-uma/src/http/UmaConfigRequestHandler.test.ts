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
