import {UnauthorizedHttpError} from '@digita-ai/handlersjs-http';
import {Principal} from '../UmaGrantProcessor';
import {ClaimTokenProcessor, ClaimTokenRequest} from './ClaimTokenProcessor';

/**
 * A dummy claim token processor for debugging purposes
 *
 * **DO NOT USE IN PRODUCTION!**
 */
export class BasicClaimTokenProcessor extends ClaimTokenProcessor {
  /**
     * Process a dummy token of type 'urn:authorization-agent:dummy-token'.
     *
     * @summary The 'urn:authorization-agent:dummy-token' is formatted as '<WebID>(.<ClientID>)?'
     * @param {ClaimTokenRequest} req
     * @return {Promise<Principal | undefined>}
     */
  public async process(req: ClaimTokenRequest): Promise<Principal | undefined> {
    if (req.claim_token_format !== 'urn:authorization-agent:dummy-token') {
      return undefined;
    }

    const tokenContents = req.claim_token.split(':');
    try {
      if (tokenContents.length > 2) {
        throw new Error('Invalid token format, only one \':\' is expected.');
      }
      const principal: Principal = {webId: new URL(decodeURIComponent(tokenContents[0])).toString()};

      if (tokenContents.length === 2) {
        principal.clientId = new URL(decodeURIComponent(tokenContents[1])).toString();
      }
      return principal;
    } catch (error: unknown) {
      const message = `Error verifying Access Token via WebID: ${(error as Error).message}`;
      throw new UnauthorizedHttpError(message);
    }
  }
}
