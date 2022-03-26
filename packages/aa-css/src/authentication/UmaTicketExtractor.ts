import fetch from 'cross-fetch';
import * as jose from 'jose';
import {ACL} from '../util/Vocabularies';
import {CredentialGroup} from './Credentials';
import type {CredentialSet} from './Credentials';
import {AccessMode, CredentialsExtractor, getLoggerFor, HttpRequest,
  NotImplementedHttpError, BadRequestHttpError} from '@solid/community-server';

const UMA_DISCOVERY = '/.well-known/uma2-configuration';

export interface UMATicketExtractorArgs {
  /**
  * URL of the trusted Authorization Service
  */
  asUrl: string;
  /**
   * Base URL of the server.
   */
  baseUrl: string;
  /**
   * Maximum token age.
   */
  maxTokenAge: number;
}

interface UmaConfig {
  jwksUri: string;
  issuer: string;
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

  private readonly asUrl: string;
  private readonly baseUrl: string;
  private readonly maxTokenAge: number;

  /**
   * Credentials extractor which interprets the contents of the Bearer authorization token as a UMA Access Token.
   * @param {UMATicketExtractorArgs} args - properties
   */
  public constructor(args: UMATicketExtractorArgs) {
    super();
    this.asUrl = args.asUrl;
    this.baseUrl = args.baseUrl;
    this.maxTokenAge = args.maxTokenAge;
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
      const umaConfig = await this.fetchUMAConfig();

      const JWKS = jose.createRemoteJWKSet(new URL(umaConfig.jwksUri));

      const {payload} = await jose.jwtVerify(token, JWKS, {
        issuer: umaConfig.issuer,
        audience: this.baseUrl,
        maxTokenAge: this.maxTokenAge,
      });

      if (!payload.sub) {
        throw new Error('UMA Access Token is missing \'sub\' claim.');
      }

      if (!payload.webid) {
        throw new Error('UMA Access Token is missing \'webid\' claim.');
      }

      if (!payload.modes || !Array.isArray(payload.modes)) {
        throw new Error('UMA Access Token is missing \'modes\' claim.');
      }

      return {[CredentialGroup.ticket]: {webId: payload.webid as string,
        resource: {path: payload.sub},
        modes: new Set((payload.modes as string[]).map(this.aclUriToAccessMode))}};
    } catch (error: unknown) {
      const message = `Error verifying UMA access token: ${(error as Error).message}`;
      this.logger.warn(message);
      throw new BadRequestHttpError(message, {cause: error});
    }
  }

  /**
   * Converts URI from the ACL vocabulary to AccessMode
   * @param {string} aclUri - URI of the access mode
   * @return {AccessMode} - access mode the URI refers to
   */
  private aclUriToAccessMode(aclUri: string): AccessMode {
    if (!modesMap[aclUri]) {
      throw new Error(`Unknown ACL Mode '${aclUri}' in token.`);
    }
    return modesMap[aclUri];
  }

  /**
   * Fetch UMA Configuration of AS
   * @return {Promise<UmaConfig>} - UMA Configuration
   */
  private async fetchUMAConfig(): Promise<UmaConfig> {
    const res = await fetch(this.asUrl + UMA_DISCOVERY);

    if (res.status >= 400) {
      throw new Error(`Unable to retrieve UMA Configuration for Authorization Server '${this.asUrl}'`);
    }

    const configuration = await res.json();

    if (!configuration.jwks_uri || !configuration.issuer) {
      throw new Error(`The UMA Configuration for Authorization Server '${this.asUrl}'` +
      ` is missing required attributes 'jwks_uri' and 'issuer'`);
    }

    return {jwksUri: configuration.jwks_uri, issuer: configuration.issuer};
  }
}
