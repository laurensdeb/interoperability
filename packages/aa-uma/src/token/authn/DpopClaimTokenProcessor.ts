import {ClaimTokenProcessor, ClaimTokenRequest} from './ClaimTokenProcessor';
import {createSolidTokenVerifier} from '@solid/access-token-verifier';
import {Principal} from '../UmaGrantProcessor';
import {UnauthorizedHttpError} from '@digita-ai/handlersjs-http';
import {NotImplementedHttpError} from '@digita-ai/handlersjs-http';

/**
 * Claim Token Processor performing Solid OIDC authentication
 * with DPoP to obtain an authenticated Principal object.
 */
export class DpopClaimTokenProcessor extends ClaimTokenProcessor {
  private readonly verify = createSolidTokenVerifier();
  /**
     * Processes the claim token request, in the process performing Solid OIDC
     * authentication.
     *
     * @param {ClaimTokenRequest} req - request
     * @return {Promise<Principal | undefined>} - returns a Principal if authentication was succesfull,
     *                                            undefined if the token format is unsupported
     */
  public async process(req: ClaimTokenRequest): Promise<Principal | undefined> {
    if (req.claim_token_format !== 'http://openid.net/specs/openid-connect-core-1_0.html#IDToken') {
      return undefined;
    }

    if (!req.dpop) {
      throw new NotImplementedHttpError('DPoP Header is missing.');
    }

    try {
      const {client_id: clientId, webid: webId} = await this.verify(
          `DPoP ${req.claim_token}`,
          {
            header: req.dpop!,
            method: req.method,
            url: req.url.toString(),
          },
      );
      return {webId, clientId};
    } catch (error: unknown) {
      const message = `Error verifying Access Token via WebID: ${(error as Error).message}`;
      throw new UnauthorizedHttpError(message);
    }
  }
}
