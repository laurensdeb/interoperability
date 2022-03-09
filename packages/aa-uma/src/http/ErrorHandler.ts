import {HttpHandler, HttpHandlerContext, HttpHandlerResponse} from '@digita-ai/handlersjs-http';
import {Observable, of, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

export const statusCodes: { [code: number]: string } = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: `I'm a teapot`,
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop detected',
  510: 'Not Extended',
  511: 'Network Authentication Required',
};

/**
 * Handler class that properly processes the HttpErrors from handlersjs-http
 */
export class JsonHttpErrorHandler implements HttpHandler {
  /**
   * Creates an {ErrorHandler} that catches errors and returns an error response to the given handler.
   */
  constructor(
    private nestedHandler: HttpHandler,
  ) {
  }

  /**
   * Handle Http Request and catch any Errors that occur
   *
   * @param {HttpHandlerContext} context - Request context
   * @return {Observable<HttpHandlerResponse>}
   */
  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    return this.nestedHandler.handle(context).pipe(
        catchError((error) => of({
          status: statusCodes[error?.statusCode] ? error.statusCode : 500,
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({
            'status': statusCodes[error?.statusCode] ? error.statusCode : 500,
            'description': statusCodes[error?.statusCode] ? statusCodes[error.statusCode] : statusCodes[500],
            'message': error?.message ? error.message : undefined,
          }),
        })),
    );
  }
}
