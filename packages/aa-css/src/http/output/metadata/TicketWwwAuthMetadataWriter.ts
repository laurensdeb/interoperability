import {MetadataWriter, getLoggerFor, HttpResponse,
  RepresentationMetadata, HTTP, addHeader} from '@solid/community-server';
import type {Term} from 'rdf-js';
import {UmaClient} from '../../../uma/UmaClient';
import {ExtendedAccountStore} from '../../../util/ExtendedAccountStore';
import {AUTH} from '../../../util/Vocabularies';

export interface AsWwwAuthMetadataWriterArgs {
  /**
  * UMA Client
  */
  umaClient: UmaClient;
  /**
   * Account Store
   */
  accountStore: ExtendedAccountStore;
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

  private readonly umaClient: UmaClient;
  private readonly accountStore: ExtendedAccountStore;

  /**
   * Adds the `WWW-Authenticate` header with the injected value in case the response status code is 401.
   * @param {AsWwwAuthMetadataWriterArgs} args
   */
  public constructor(args: AsWwwAuthMetadataWriterArgs) {
    super();
    this.umaClient = args.umaClient;
    this.accountStore = args.accountStore;
  }

  /**
   * For a given ticketSubject this method will aim to retrieve
   * the Pod owner (a requirement for the UMA AS to know).
   *
   * @param {string} ticketSubject
   */
  private async retrievePodOwner(ticketSubject: string): Promise<string | undefined> {
    const webIdSettings = await this.accountStore.getWebIdSettings();

    for (const tup of webIdSettings) {
      const webid = tup[0];
      const setting = tup[1];
      if (setting.podBaseUrl && ticketSubject.startsWith(setting?.podBaseUrl)) {
        return webid;
      }
    }
    return undefined;
  }

  /**
   * Add the WWW-Authenticate header to the response in case of a 401 error response
   * @param {AsWwwAuthHandlerArgs} input
   */
  public async handle(input: AsWwwAuthHandlerArgs): Promise<void> {
    const statusLiteral = input.metadata.get(HTTP.terms.statusCodeNumber);
    if (statusLiteral?.value === '401') {
      this.logger.info('Invoked AS WWW Auth writer');
      try {
        await this.setUmaHeader(input.metadata, input.response);
      } catch (e) {
        this.logger.error(`Error while adding UMA header: ${(e as Error).message}`);
      }
    }
  }

  /**
   * Sets the UMA header
   *
   * @param {RepresentationMetadata} metadata
   * @param {HttpResponse} response
   */
  private async setUmaHeader(metadata: RepresentationMetadata, response: HttpResponse): Promise<void> {
    const ticketNeeds = new Set(metadata.getAll(AUTH.terms.ticketNeeds).map(this.termToString));
    const ticketSubject = metadata.get(AUTH.terms.ticketSubject);
    if (ticketNeeds && ticketSubject) {
      const owner = await this.retrievePodOwner(ticketSubject.value);
      if (owner) {
        const permissionTicket = await this.umaClient.fetchPermissionTicket({ticketSubject: ticketSubject.value,
          owner, ticketNeeds});
        if (permissionTicket) {
          addHeader(response, 'WWW-Authenticate', `UMA realm="solid",` +
        `as_uri="${this.umaClient.getAsUrl()}",ticket="${permissionTicket}"`);
        }
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
