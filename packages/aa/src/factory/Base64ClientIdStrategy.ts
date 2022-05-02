import {ClientIdStrategy} from './ClientIdStrategy';
import {RoutePath} from '@thundr-be/sai-helpers';

/**
 * ClientIDStrategy using the Base64 encoded
 * version of the WebID as ClientID.
 */
export class Base64ClientIdStrategy extends ClientIdStrategy {
  /**
     * @param {RoutePath} aaClientPath - Base route under which the Authorization Agent Client IDs are served
     */
  constructor(private readonly aaClientPath: RoutePath) {
    super();
  }

  /**
   * Retrieve the correct ClientId for some WebId
   * @param {string} webid
   * @return {Promise<string>} clientid
   */
  public async getClientIdForWebId(webid: string): Promise<string> {
    const webIdBase = Buffer.from(webid, 'utf-8').toString('base64');
    return `${this.aaClientPath.getUri()}${encodeURIComponent(webIdBase)}`;
  }

  /**
   * Retrieve the WebId used to construct some
   * ClientID.
   * @param {string} clientid
   * @return {Promise<string>} webid
   */
  public async getWebIdForClientId(clientid: string): Promise<string> {
    if (!clientid.startsWith(`${this.aaClientPath.getUri()}`)) {
      throw new Error('ClientID was not generated using this ClientIdStrategy');
    }
    const webIdBase = decodeURIComponent(clientid.substring(`${this.aaClientPath.getUri()}`.length));

    if (!webIdBase || !(/[A-Za-z0-9+/=]/.test(webIdBase))) {
      throw new Error('ClientID was not generated using this ClientIdStrategy');
    }

    const webId = Buffer.from(webIdBase, 'base64').toString('utf-8');

    return webId;
  }
}
