import {UnsupportedMediaTypeHttpError} from '@digita-ai/handlersjs-http';
import {BadRequestHttpError} from '@digita-ai/handlersjs-http';
import {HttpHandler, HttpHandlerContext, HttpHandlerResponse} from '@digita-ai/handlersjs-http';
import {from, map, Observable, of} from 'rxjs';

export interface TokenResponse {
  access_token: string,
  refresh_token?: string,
  id_token?: string,
  token_type: string,
  expires_in?: number
}

/**
 * A GrantTypeProcessor processes the token request
 * for a specific grant type.
 */
export abstract class GrantTypeProcessor {
  public abstract getSupportedGrantType(): string;
  public abstract process(body: Map<string, string>, context: HttpHandlerContext): Promise<TokenResponse>;
}

const GRANT_TYPE = 'grant_type';
/**
 * The Token Request Handler implements the interface of the OAuth/UMA Token Endpoint
 * using application/x-www-form-urlencoded as a serialization for the POST body.
 */
export class TokenRequestHandler implements HttpHandler {
  private readonly grantProcessors: Map<string, GrantTypeProcessor>;

  /**
   * The Token Request Handler implements the interface of the OAuth/UMA Token Endpoint
   * using application/x-www-form-urlencoded as a serialization for the POST body.
   * @param {GrantTypeProcessor[]} processors - a list of Grant Type Processors.
   */
  constructor(processors: GrantTypeProcessor[]) {
    this.grantProcessors = new Map();
    processors.forEach((value) => this.grantProcessors.set(value.getSupportedGrantType(), value));
  }

  /**
   * Handles an incoming token request.
   *
   * @param {HttpHandlerContext} input - Request context
   * @return {Observable<HttpHandlerResponse<any>>} - response
   */
  handle(input: HttpHandlerContext): Observable<HttpHandlerResponse<any>> {
    if (input.request.headers['content-type'] !== 'application/x-www-form-urlencoded') {
      throw new UnsupportedMediaTypeHttpError();
    }

    const bodyParams = new URLSearchParams(input.request.body);

    if (!bodyParams.has(GRANT_TYPE) || !bodyParams.get(GRANT_TYPE)) {
      throw new BadRequestHttpError('Request body is missing required key \'grant_type\'.');
    }
    const grantType = bodyParams.get(GRANT_TYPE)!;

    // Collect body params in map
    const parsedRequestBody = new Map<string, string>();
    bodyParams.forEach((value, key) => {
      parsedRequestBody.set(key, value);
    });

    // Get processor for grant type
    if (!this.grantProcessors.has(grantType)) {
      throw new BadRequestHttpError(`Unsupported grant type: '${grantType}'`);
    }

    // Process grant type
    const grantProcessor = this.grantProcessors.get(grantType)!;

    // Return token response
    const tokenResponse = from(grantProcessor.process(parsedRequestBody, input));

    // Serialize response as JSON
    return tokenResponse.pipe(map((data) => {
      return {body: JSON.stringify(data), headers: {'content-type': 'application/json'}, status: 200};
    }));
  }
}
