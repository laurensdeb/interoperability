import {HttpHandlerContext} from '@digita-ai/handlersjs-http';
import {GrantTypeProcessor, TokenResponse} from '../http/TokenRequestHandler';

/**
 * Simple Mocking Grant Processor
 */
export class MockUmaGrantProcessor implements GrantTypeProcessor {
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
