import {getLoggerFor} from '@solid/community-server';
import fetch from 'cross-fetch';
import * as jose from 'jose';
import {isString} from '../util/StringGuard';
import {UmaClient, UmaConfig, UmaToken} from './UmaClient';

export interface UmaClientArgs {
    /**
    * URL of the trusted Authorization Service
    */
    asUrl: string;
    /**
     * Base URL of the server.
     */
    baseUrl: string;
    /**
     * Credentials used to authenticate
     * Requests with the Authorization Service.
     */
    credentials: {
    /**
     * Elliptic Curve Algorithm
     */
    ecAlgorithm: 'ES256' | 'ES384' | 'ES512';
    /**
     * Elliptic Curve Private Key
     */
    ecPrivateKey: string;
    }
    /**
     * Maximum token age.
     */
    maxTokenAge: number;
  }

const UMA_DISCOVERY = '/.well-known/uma2-configuration';

/**
 * A UmaClient provides an API for using the
 * features of a UMA Authorization Service.
 */
export class UmaClientImpl extends UmaClient {
  protected readonly logger = getLoggerFor(this);

  private readonly asUrl: string;
  private readonly baseUrl: string;

  private credentials: {
      ecAlgorithm: 'ES256' | 'ES384' | 'ES512';
      ecPrivateKey: string;
  };

  private privateKey: jose.KeyLike | undefined;
  private readonly maxTokenAge: number;

  /**
   * @param {UmaClientArgs} args - configuration of the UmaClient
   */
  constructor(args: UmaClientArgs) {
    super();
    this.asUrl = args.asUrl;
    this.baseUrl = args.baseUrl;
    this.credentials = args.credentials;
    this.maxTokenAge = args.maxTokenAge;
  }

  /**
   * Initializes the private key if it
   * hasn't been initialized beforehand.
   */
  private async initializeKey() {
    if (!this.privateKey) {
      this.privateKey = await jose.importPKCS8(this.credentials.ecPrivateKey,
          this.credentials.ecAlgorithm);
    }
  }

  /**
   * Get the AS Base URL
   * @return {string} URL of the Authorization Service
   */
  public getAsUrl(): string {
    return this.asUrl;
  }

  /**
   * Validates & parses Access Token
   * @param {string} token - access token
   * @return {UmaToken}
   */
  public async verifyToken(token: string): Promise<UmaToken> {
    try {
      // Validate token JWT against JWKS of UMA Server
      const umaConfig = await this.fetchUMAConfig();

      const JWKS = jose.createRemoteJWKSet(new URL(umaConfig.jwks_uri));

      const {payload} = await jose.jwtVerify(token, JWKS, {
        issuer: umaConfig.issuer,
        audience: this.baseUrl,
        maxTokenAge: this.maxTokenAge,
      });
      this.logger.info('Validated UMA token.');

      if (!payload.sub) {
        throw new Error('UMA Access Token is missing \'sub\' claim.');
      }

      if (!payload.webid || !isString(payload.webid)) {
        throw new Error('UMA Access Token is missing authenticated client \'webid\' claim.');
      }

      if (!payload.azp || !isString(payload.azp)) {
        throw new Error('UMA Access Token is missing authenticated client \'azp\' claim.');
      }

      if (!payload.modes || !Array.isArray(payload.modes)) {
        throw new Error('UMA Access Token is missing \'modes\' claim.');
      }

      return {webid: payload.webid, azp: payload.azp, resource: payload.sub, modes: payload.modes};
    } catch (error: unknown) {
      const message = `Error verifying UMA access token: ${(error as Error).message}`;
      this.logger.warn(message);
      throw new Error(message);
    }
  }

  /**
   * Generate a new JWT for authentication with the
   * Permission Registration endpoint.
   *
   * @return {string} - JWT
   */
  private async getJwt(): Promise<string> {
    await this.initializeKey();
    return await new jose.SignJWT({})
        .setProtectedHeader({alg: this.credentials.ecAlgorithm})
        .setIssuedAt()
        .setIssuer(this.baseUrl)
        .setAudience(this.asUrl)
        .setExpirationTime('1m')
        .sign(this.privateKey!);
  }

  /**
   * Fetch UMA Configuration of AS
   * @return {Promise<UmaConfig>} - UMA Configuration
   */
  public async fetchUMAConfig(): Promise<UmaConfig> {
    const res = await fetch(this.asUrl + UMA_DISCOVERY);

    if (res.status >= 400) {
      throw new Error(`Unable to retrieve UMA Configuration for Authorization Server '${this.asUrl}'`);
    }

    const configuration = await res.json();

    if (!configuration.jwks_uri || !configuration.issuer || !configuration.permission_registration_endpoint) {
      throw new Error(`The UMA Configuration for Authorization Server '${this.asUrl}'` +
          ` is missing required attributes 'jwks_uri', 'issuer' or 'permission_registration_endpoint'`);
    }

    return {jwks_uri: configuration.jwks_uri, issuer: configuration.issuer,
      permission_registration_endpoint: configuration.permission_registration_endpoint};
  }


  /**
   * Method to fetch a ticket from the Permission Registration endpoint
   * of the UMA Authorization Service.
   *
   * @param {string} ticketSubject
   * @param {string} owner
   * @param {Set<string>} ticketNeeds
   */
  public async fetchPermissionTicket(ticketSubject: string, owner: string,
      ticketNeeds: Set<string>): Promise<string | undefined> {
    let json;
    let ticketResponse;
    try {
      const permissionEndpoint = (await this.fetchUMAConfig()).permission_registration_endpoint;
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
}
