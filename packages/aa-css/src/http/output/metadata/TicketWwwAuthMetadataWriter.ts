import {MetadataWriter, getLoggerFor, HttpResponse,
  RepresentationMetadata, HTTP, addHeader} from '@solid/community-server';
import * as jose from 'jose';
import type {Term} from 'rdf-js';
import {ExtendedAccountStore} from '../../../util/ExtendedAccountStore';
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
  accountStore: ExtendedAccountStore;
  /**
   * Elliptic Curve Algorithm
   */
  ecAlgorithm: 'ES256' | 'ES384' | 'ES512';
  /**
   * Elliptic Curve Private Key
   */
  ecPrivateKey: string
}

export interface AsWwwAuthHandlerArgs {
  response: HttpResponse;
  metadata: RepresentationMetadata;
}

export type UmaAsConfiguration = {
  issuer: string,
  permission_registration_endpoint: string
}

const AS_DISCOVERY_URI = '/.well-known/uma2-configuration';

/**
 * Adds the `WWW-Authenticate` header with the injected value in case the response status code is 401.
 */
export class TicketWwwAuthMetadataWriter extends MetadataWriter {
  protected readonly logger = getLoggerFor(this);

  private readonly asUrl: string;
  private readonly baseUrl: string;
  private readonly accountStore: ExtendedAccountStore;
  private readonly ecAlgorithm: 'ES256' | 'ES384' | 'ES512';
  private readonly ecPrivateKey: string;

  /**
   * Adds the `WWW-Authenticate` header with the injected value in case the response status code is 401.
   * @param {AsWwwAuthMetadataWriterArgs} args
   */
  public constructor(args: AsWwwAuthMetadataWriterArgs) {
    super();
    this.asUrl = args.asUrl;
    this.baseUrl = args.baseUrl;
    this.accountStore = args.accountStore;
    this.ecAlgorithm = args.ecAlgorithm;
    this.ecPrivateKey = args.ecPrivateKey;
  }

  /**
   * Method to retrieve the UMA Discovery configuration for the
   * configured AS.
   *
   * @return {Promise<UmaAsConfiguration>}
   */
  private async retrieveUMAConfiguration(): Promise<UmaAsConfiguration> {
    const asConfiguration = await fetch(`${this.asUrl}${AS_DISCOVERY_URI}`)
        .then((res) => {
          if (res.status !== 200) {
            throw new Error('Error while retrieving UMA2 Configuration with AS.');
          }
          return res;
        })
        .then((res) => res.json());

    if (!asConfiguration.issuer || !asConfiguration.permission_registration_endpoint) {
      throw new Error('Invalid UMA2 configuration returned by AS.');
    }

    if (typeof asConfiguration.issuer !== 'string' ||
      typeof asConfiguration.permission_registration_endpoint !== 'string') {
      throw new Error('Invalid UMA2 configuration returned by AS.');
    }

    return {issuer: asConfiguration.issuer,
      permission_registration_endpoint: asConfiguration.permission_registration_endpoint};
  }

  /**
   * Generate a new JWT for authentication with the
   * Permission Registration endpoint.
   *
   * @return {string} - JWT
   */
  private async getJwt(): Promise<string> {
    const privateKey = await jose.importPKCS8(this.ecPrivateKey, this.ecAlgorithm);
    return await new jose.SignJWT({})
        .setProtectedHeader({alg: this.ecAlgorithm})
        .setIssuedAt()
        .setIssuer(this.baseUrl)
        .setAudience(this.asUrl)
        .setExpirationTime('1m')
        .sign(privateKey);
  }

  /**
   * Method to fetch a ticket from the Permission Registration endpoint
   * of the UMA Authorization Service.
   *
   * @param {string} ticketSubject
   * @param {Set<string>} ticketNeeds
   */
  private async fetchPermissionTicket(ticketSubject: string, ticketNeeds: Set<string>): Promise<string | undefined> {
    let json;
    let owner: string;
    let ticketResponse;
    try {
      owner = await this.retrievePodOwner(ticketSubject);
      const permissionEndpoint = (await this.retrieveUMAConfiguration()).permission_registration_endpoint;
      ticketResponse = await fetch(permissionEndpoint,
          {method: 'POST',
            headers: {
              'Authorization': `Bearer ${await this.getJwt()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              owner,
              resource_set_id: ticketSubject,
              scopes: [...ticketNeeds],
            }),
          });
      json = await ticketResponse.json();
    } catch (e: any) {
      this.logger.error(`Error while retrieving ticket: ${(e as Error).message}`);
      return undefined;
    }

    if (ticketResponse.status !== 200) {
      this.logger.error(`Error while generating UMA Ticket. Retrieved: ${JSON.stringify(json)}`);
      return undefined;
    }

    if (!json.ticket || typeof json.ticket !== 'string') {
      this.logger.error('Invalid response from UMA AS: missing or invalid \'ticket\'');
      return undefined;
    }

    return json.ticket;
  }

  /**
   * For a given ticketSubject this method will aim to retrieve
   * the Pod owner (a requirement for the UMA AS to know).
   *
   * @param {string} ticketSubject
   */
  private async retrievePodOwner(ticketSubject: string): Promise<string> {
    const webIdSettings = await this.accountStore.getWebIdSettings();

    for (const tup of webIdSettings) {
      const webid = tup[0];
      const setting = tup[1];
      if (setting.podBaseUrl && ticketSubject.startsWith(setting?.podBaseUrl)) {
        return webid;
      }
    }
    throw new Error('Pod owner not found.');
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
        const permissionTicket = await this.fetchPermissionTicket(ticketSubject.value, ticketNeeds);
        if (permissionTicket) {
          addHeader(input.response, 'WWW-Authenticate', `UMA realm="solid",` +
        `as_uri="${this.asUrl}",ticket="${permissionTicket}"`);
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
