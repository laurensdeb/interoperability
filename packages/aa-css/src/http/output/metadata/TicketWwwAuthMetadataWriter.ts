import {MetadataWriter, getLoggerFor, HttpResponse,
  RepresentationMetadata, HTTP, addHeader} from '@solid/community-server';
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
}

/**
 * Adds the `WWW-Authenticate` header with the injected value in case the response status code is 401.
 */
export class TicketWwwAuthMetadataWriter extends MetadataWriter {
  protected readonly logger = getLoggerFor(this);

  private readonly asUrl: string;
  private readonly baseUrl: string;

  public constructor(args: AsWwwAuthMetadataWriterArgs) {
    super();
    this.asUrl = args.asUrl;
    this.baseUrl = args.baseUrl;
  }

  public async handle(input: { response: HttpResponse; metadata: RepresentationMetadata }): Promise<void> {
    this.logger.info('Invoked AS WWW Auth writer');
    const statusLiteral = input.metadata.get(HTTP.terms.statusCodeNumber);

    if (statusLiteral?.value === '401') {
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

        addHeader(input.response, 'WWW-Authenticate', `UMA realm="${this.baseUrl}",` +
        `as_uri="${this.asUrl}",ticket="${jwt}"`);
      }
    }
  }

  private termToString(term: Term): string {
    return term.value;
  }
}
