import {ACL} from '../util/Vocabularies';
import {CredentialGroup} from './Credentials';
import type {CredentialSet} from './Credentials';
import {AccessMode, CredentialsExtractor, getLoggerFor, HttpRequest,
  NotImplementedHttpError, BadRequestHttpError} from '@solid/community-server';
import {UmaClient} from '../uma/UmaClient';

export interface UMATicketExtractorArgs {
  /**
  * UMA Client
  */
  umaClient: UmaClient;
}

const modesMap: Record<string, AccessMode> = {
  [ACL.Read]: AccessMode.read,
  [ACL.Write]: AccessMode.write,
  [ACL.Create]: AccessMode.create,
  [ACL.Delete]: AccessMode.delete,
  [ACL.Append]: AccessMode.append,
} as const;

/**
 * Credentials extractor which interprets the contents of the Bearer authorization token as a UMA Access Token.
 */
export class UMATicketExtractor extends CredentialsExtractor {
  protected readonly logger = getLoggerFor(this);

  private readonly umaClient: UmaClient;

  /**
   * Credentials extractor which interprets the contents of the Bearer authorization token as a UMA Access Token.
   * @param {UMATicketExtractorArgs} args - properties
   */
  public constructor(args: UMATicketExtractorArgs) {
    super();
    this.umaClient = args.umaClient;
  }

  /**
   * Tests if extractor can handle the request.
   * @param {HttpRequest} param0
   */
  public async canHandle({headers}: HttpRequest): Promise<void> {
    const {authorization} = headers;
    if (!authorization || !/^Bearer /ui.test(authorization)) {
      throw new NotImplementedHttpError('No Bearer Authorization header specified.');
    }
  }

  /**
   * We assume a UMA Ticket to contain at least following claims in the payload:
   * sub (= resource), aud (== base_url), modes (== AccessMode[]),
   */
  public async handle({headers}: HttpRequest): Promise<CredentialSet> {
    const token = /^Bearer\s+(.*)/ui.exec(headers.authorization!)![1];

    try {
      // Validate token JWT against JWKS of UMA Server
      const umaToken = await this.umaClient.verifyToken(token);

      return {[CredentialGroup.ticket]: {webId: umaToken.webid,
        resource: {path: umaToken.resource},
        modes: new Set(umaToken.modes.map(this.aclUriToAccessMode))}};
    } catch (error: unknown) {
      const msg = `Error verifying WebID via Bearer access token: ${(error as Error).message}`;
      throw new BadRequestHttpError(msg, {cause: error});
    }
  }

  /**
   * Converts URI from the ACL vocabulary to AccessMode
   * @param {string} aclUri - URI of the access mode
   * @return {AccessMode} - access mode the URI refers to
   */
  private aclUriToAccessMode(aclUri: string): AccessMode {
    if (!(aclUri in modesMap)) {
      throw new Error(`Unknown ACL Mode '${aclUri}' in token.`);
    }
    return modesMap[aclUri];
  }
}
