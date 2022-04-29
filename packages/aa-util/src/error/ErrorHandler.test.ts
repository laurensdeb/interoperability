import {HttpHandlerResponse, HttpHandlerContext} from '@digita-ai/handlersjs-http';
import {lastValueFrom, of, throwError} from 'rxjs';
import {JsonHttpErrorHandler} from './ErrorHandler';

const response: HttpHandlerResponse = {
  body: 'upstream response body',
  headers: {
    location: `http://test.be`,
  },
  status: 400,
};

const context: HttpHandlerContext = {
  request: {
    url: new URL('http://example.org'),
    method: 'GET',
    headers: {},
  },
};

describe('error_handler', () => {
  const nestedHttpHandler = {handle: jest.fn().mockReturnValue(throwError(() => response))};

  const errorHandlerTrue = new JsonHttpErrorHandler(nestedHttpHandler);

  it('should be instantiated correctly', () => {
    expect(errorHandlerTrue).toBeTruthy();
  });

  describe('handle', () => {
    it.each`
    statusCode         | expected
    ${ undefined } | ${`{\"status\":500,\"description\":\"Internal Server Error\"}`}
    ${ 400 }       | ${`{\"status\":400,\"description\":\"Bad Request\"}`}
    ${ 500 }       | ${`{\"status\":500,\"description\":\"Internal Server Error\"}`}
  `('should return $expected when $status is handled and flag is $flag', async ({statusCode, expected}) => {
      nestedHttpHandler.handle = jest.fn().mockReturnValue(throwError({...response, statusCode}));

      const newErrorHandler = new JsonHttpErrorHandler(nestedHttpHandler);

      const res = await lastValueFrom(newErrorHandler.handle(context));
      expect(res.body).toEqual(expected);
    });

    it('should return a message in the body if one is provided', async () => {
      nestedHttpHandler.handle = jest.fn().mockReturnValue(
          throwError({...response, statusCode: 400, message: 'This is a message'}),
      );

      const newErrorHandler = new JsonHttpErrorHandler(nestedHttpHandler);

      const res = await lastValueFrom(newErrorHandler.handle(context));

      expect(res.headers).toEqual({'content-type': 'application/json'});
      expect(res.body).toEqual(`{\"status\":400,\"description\":\"Bad Request\",\"message\":\"This is a message\"}`);
      expect(res.status).toEqual(400);
    });

    it('should return a type in the body if one is provided', async () => {
      nestedHttpHandler.handle = jest.fn().mockReturnValue(
          throwError({...response, statusCode: 400, type: 'invalid_grant', message: 'This is a message'}),
      );

      const newErrorHandler = new JsonHttpErrorHandler(nestedHttpHandler);

      const res = await lastValueFrom(newErrorHandler.handle(context));

      expect(res.headers).toEqual({'content-type': 'application/json'});
      expect(res.body).toEqual(`{\"status\":400,\"description\":\"Bad Request\",\"error\":\"invalid_grant\",`+
      `\"message\":\"This is a message\"}`);
      expect(res.status).toEqual(400);
    });

    it('should return additionalParams in the body if one is provided', async () => {
      nestedHttpHandler.handle = jest.fn().mockReturnValue(
          throwError({...response, statusCode: 400, additionalParams: {'abc': 'def'}, message: 'This is a message'}),
      );

      const newErrorHandler = new JsonHttpErrorHandler(nestedHttpHandler);

      const res = await lastValueFrom(newErrorHandler.handle(context));

      expect(res.headers).toEqual({'content-type': 'application/json'});
      expect(res.body).toEqual(`{\"status\":400,\"description\":\"Bad Request\",`+
      `\"message\":\"This is a message\",\"abc\":\"def\"}`);
      expect(res.status).toEqual(400);
    });


    it('should set an content type and status as 500 if not known', async () => {
      nestedHttpHandler.handle = jest.fn().mockReturnValue(
          throwError({...response, statusCode: 444, headers: undefined}),
      );

      const newErrorHandler = new JsonHttpErrorHandler(nestedHttpHandler);

      const res = await lastValueFrom(newErrorHandler.handle(context));

      expect(res.headers).toEqual({'content-type': 'application/json'});
      expect(res.status).toEqual(500);
    });

    it('should do nothing if status is 200', async () => {
      nestedHttpHandler.handle = jest.fn().mockReturnValue(of({...response, status: 200}));

      const newErrorHandler = new JsonHttpErrorHandler(nestedHttpHandler);

      const res = await lastValueFrom(newErrorHandler.handle(context));
      expect(res.body).toEqual(`upstream response body`);
      expect(res.status).toEqual(200);
    });
  });
});
