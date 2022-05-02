import {getLoggerFor} from '@solid/community-server';
import * as jose from 'jose';
import {PermissionTicketRequest, UmaClient, UmaConfig, UmaToken} from './UmaClient';
import {fetchPermissionTicket} from './util/PermissionTicketFetcher';
import {fetchUMAConfig} from './util/UmaConfigFetcher';
import {verifyUMAToken} from './util/UmaTokenVerifier';
import {MemoizeExpiring} from 'typescript-memoize';

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
      return await verifyUMAToken(token, umaConfig, {baseUrl: this.baseUrl, maxTokenAge: this.maxTokenAge});
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
  @MemoizeExpiring(60000)
  public async fetchUMAConfig(): Promise<UmaConfig> {
    return await fetchUMAConfig(this.asUrl);
  }


  /**
   * Method to fetch a ticket from the Permission Registration endpoint
   * of the UMA Authorization Service.
   *
   * @param {PermissionTicketRequest} request
   * @return {Promise<string | undefined>}
   */
  public async fetchPermissionTicket(request: PermissionTicketRequest): Promise<string | undefined> {
    try {
      const permissionEndpoint = (await this.fetchUMAConfig()).permission_registration_endpoint;
      return await fetchPermissionTicket(request, {bearer: await this.getJwt(),
        permission_registration_endpoint: permissionEndpoint});
    } catch (e: any) {
      this.logger.error(`Error while retrieving ticket: ${(e as Error).message}`);
      return undefined;
    }
  }
}
