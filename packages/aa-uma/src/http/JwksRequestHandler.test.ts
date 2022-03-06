import {JwksRequestHandler} from './JwksRequestHandler';
import {InMemoryJwksKeyHolder} from '../secrets/InMemoryJwksKeyHolder';
import {lastValueFrom} from 'rxjs';
import {HttpHandlerContext} from '@digita-ai/handlersjs-http';

describe('Happy flows', () => {
  const keyHolder = new InMemoryJwksKeyHolder('ES256');
  const requestHandler = new JwksRequestHandler(keyHolder);
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

  test('Returns JWKS in response body', async () => {
    const response = await lastValueFrom(requestHandler.handle(requestContext));
    expect(response.body).toEqual(JSON.stringify(await keyHolder.getJwks()));
    expect(response.status).toEqual(200);
  });
});

describe('Unhappy flows', () => {
  const keyHolder = new InMemoryJwksKeyHolder('ES256');
  const requestHandler = new JwksRequestHandler(keyHolder);
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
