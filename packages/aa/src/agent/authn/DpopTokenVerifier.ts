import {UnauthorizedHttpError} from '@digita-ai/handlersjs-http';
import {Logger, getLoggerFor} from '@thundr-be/sai-helpers';
import {createSolidTokenVerifier} from '@solid/access-token-verifier';
import {AuthenticationRequest, AuthenticationResult, TokenVerifier} from './TokenVerifier';

/**
 * A TokenVerifier parsing Solid OIDC DPoP-bound
 * identity tokens to authenticate a request.
 */
export class DpopTokenVerifier extends TokenVerifier {
  protected readonly logger: Logger = getLoggerFor(this);

  private readonly verify = createSolidTokenVerifier();
  /**
     * @param {AuthenticationRequest} request
     * @return {Promise<AuthenticationResult>}
     */
  public async authenticate(request: AuthenticationRequest): Promise<AuthenticationResult> {
    if (!request.dpop) {
      const msg = 'DPoP Header is missing.';
      this.logger.debug(msg);
      throw new UnauthorizedHttpError(msg);
    }

    try {
      const {client_id: clientId, webid: webId} = await this.verify(
          `DPoP ${request.bearer}`,
          {
            header: request.dpop!,
            method: request.method,
            url: request.url,
          },
      );
      this.logger.info(`Authenticated as ${webId} via Solid OIDC.`);
      return {webId, clientId};
    } catch (error: unknown) {
      const message = `Error verifying Access Token via WebID: ${(error as Error).message}`;
      this.logger.debug(message);
      throw new UnauthorizedHttpError(message);
    }
  }
}
