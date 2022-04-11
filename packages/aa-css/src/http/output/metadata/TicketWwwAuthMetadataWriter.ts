import {MetadataWriter, getLoggerFor, HttpResponse,
  RepresentationMetadata, HTTP, addHeader, AccountStore} from '@solid/community-server';
import * as jose from 'jose';
import type {Term} from 'rdf-js';
import {v4} from 'uuid';
import {AUTH} from '../../../util/Vocabularies';

export interface AsWwwAuthMetadataWriterArgs {
  /**
  * URL of the trusted Authorization Service
  */
  asUrl: string;
  /**
   * Base URL of the server.
   */
  baseUrl: string;
  /**
   * Account Store
   */
  accountStore: AccountStore;
}

export interface AsWwwAuthHandlerArgs {
  response: HttpResponse;
  metadata: RepresentationMetadata;
}

/**
 * Adds the `WWW-Authenticate` header with the injected value in case the response status code is 401.
 */
export class TicketWwwAuthMetadataWriter extends MetadataWriter {
  protected readonly logger = getLoggerFor(this);

  private readonly asUrl: string;
  private readonly baseUrl: string;
  private readonly accountStore: AccountStore;

  /**
   * Adds the `WWW-Authenticate` header with the injected value in case the response status code is 401.
   * @param {AsWwwAuthMetadataWriterArgs} args
   */
  public constructor(args: AsWwwAuthMetadataWriterArgs) {
    super();
    this.asUrl = args.asUrl;
    this.baseUrl = args.baseUrl;
    this.accountStore = args.accountStore;
  }

  /**
   * Add the WWW-Authenticate header to the response in case of a 401 error response
   * @param {AsWwwAuthHandlerArgs} input
   */
  public async handle(input: AsWwwAuthHandlerArgs): Promise<void> {
    const statusLiteral = input.metadata.get(HTTP.terms.statusCodeNumber);

    if (statusLiteral?.value === '401') {
      this.logger.info('Invoked AS WWW Auth writer');

      const ticketNeeds = new Set(input.metadata.getAll(AUTH.terms.ticketNeeds).map(this.termToString));
      const ticketSubject = input.metadata.get(AUTH.terms.ticketSubject);
      if (ticketNeeds && ticketSubject) {
        // Task: make keypair configurable
        const secret = await jose.generateSecret('HS256');

        const jwt = await new jose.SignJWT({modes: [...ticketNeeds]})
            .setSubject(ticketSubject.value)
            .setAudience(this.asUrl)
            .setIssuedAt(Date.now())
            .setIssuer(this.baseUrl)
            .setProtectedHeader({alg: 'HS256'})
            .setJti(v4())
            .sign(secret);

        addHeader(input.response, 'WWW-Authenticate', `UMA realm="solid",` +
        `as_uri="${this.asUrl}",ticket="${jwt}"`);
      }
    }
  }

  /**
   * Utility for converting an RDF term to a String value
   * @param {Term} term
   * @return {string}
   */
  private termToString(term: Term): string {
    return term.value;
  }
}
