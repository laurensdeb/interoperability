import {Logger, getLoggerFor} from '@laurensdeb/authorization-agent-helpers';
import {AuthenticationRequest, AuthenticationResult, TokenVerifier} from './TokenVerifier';
import {UnauthorizedHttpError} from '@digita-ai/handlersjs-http';

/**
 * A dummy claim token processor for debugging purposes
 *
 * **DO NOT USE IN PRODUCTION!**
 */
export class DummyTokenVerifier extends TokenVerifier {
  protected readonly logger: Logger = getLoggerFor(this);

  /**
   * A dummy claim token processor for debugging purposes
   */
  constructor() {
    super();
    this.logger.warn(`The DummyTokenVerifier was enabled. DO NOT USE THIS IN PRODUCTION!`);
  }

  /**
     * Process a dummy token of type 'urn:authorization-agent:dummy-token'.
     *
     * @summary The 'urn:authorization-agent:dummy-token' is formatted as '<WebID>(.<ClientID>)?'
     * @param {AuthenticationRequest} request
     * @return {Promise<AuthenticationResult>}
     */
  public async authenticate(request: AuthenticationRequest): Promise<AuthenticationResult> {
    const tokenContents = request.bearer.split(':');
    try {
      if (tokenContents.length > 2) {
        throw new Error('Invalid token format, only one \':\' is expected.');
      }
      const principal: AuthenticationResult = {webId: new URL(decodeURIComponent(tokenContents[0])).toString()};

      if (tokenContents.length === 2) {
        principal.clientId = new URL(decodeURIComponent(tokenContents[1])).toString();
      }
      this.logger.info(`Authenticated as ${principal.webId} via a dummy token.`);
      return principal;
    } catch (error: unknown) {
      const message = `Error verifying Access Token via WebID: ${(error as Error).message}`;
      this.logger.debug(message);
      throw new UnauthorizedHttpError(message);
    }
  }
}
