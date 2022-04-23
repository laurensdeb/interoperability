import {ClientIdStrategy} from './ClientIdStrategy';

/**
 * ClientIDStrategy using the Base64 encoded
 * version of the WebID as ClientID.
 */
export class Base64ClientIdStrategy extends ClientIdStrategy {
  /**
     * @param {string} baseUrl - Base URL of the Authorization Agent
     * @param {string} aaPath - Subpath where requests to the Authorization Agent are routed to
     */
  constructor(private readonly baseUrl:string, private readonly aaPath: string) {
    super();
  }

  /**
   * Retrieve the correct ClientId for some WebId
   * @param {string} webid
   * @return {Promise<string>} clientid
   */
  public async getClientIdForWebId(webid: string): Promise<string> {
    const webIdBase = Buffer.from(webid, 'utf-8').toString('base64');
    return `${this.baseUrl}${this.aaPath}${webIdBase}`;
  }

  /**
   * Retrieve the WebId used to construct some
   * ClientID.
   * @param {string} clientid
   * @return {Promise<string>} webid
   */
  public async getWebIdForClientId(clientid: string): Promise<string> {
    if (!clientid.startsWith(`${this.baseUrl}${this.aaPath}`)) {
      throw new Error('ClientID was not generated using this ClientIdStrategy');
    }
    const webIdBase = clientid.substring(`${this.baseUrl}${this.aaPath}`.length);

    if (!webIdBase || !(/[A-Za-z0-9+/=]/.test(webIdBase))) {
      throw new Error('ClientID was not generated using this ClientIdStrategy');
    }

    const webId = Buffer.from(webIdBase, 'base64').toString('utf-8');

    return webId;
  }
}
