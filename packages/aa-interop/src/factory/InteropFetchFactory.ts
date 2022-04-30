import {FetchFactory, getLoggerFor} from '@laurensdeb/authorization-agent-helpers';
import {DpopBoundTokenFactory} from '../agent/idp/DpopBoundTokenFactory';
import {fetch} from 'cross-fetch';

export const FetchType = typeof fetch;

/**
 * A FetchFactory using the Authorization Agent ClientID
 * to authenticate requests.
 */
export class InteropFetchFactory extends FetchFactory {
  private readonly logger = getLoggerFor(this);
  /**
     * @param {DpopBoundTokenFactory} tokenFactory
     */
  constructor(private readonly tokenFactory: DpopBoundTokenFactory) {
    super();
  }
  /**
     * Returns an authenticated fetch for the specified client.
     * @param {string} clientId
     * @return {FetchType}
     */
  getAuthenticatedFetch(clientId: string): (input: RequestInfo, init?: RequestInit) => Promise<Response> {
    const tokenFactory = this.tokenFactory;
    const logger = this.logger;
    return async function fetchBoundToUMA(
        url: RequestInfo,
        init?: RequestInit,
    ): Promise<Response> {
      const token = await tokenFactory.getToken(url.toString(), (init && init!.method) ? init.method : 'GET',
          {webid: `${clientId}/profile`, azp: `${clientId}/profile`});
      return fetch(url, {
        ...init,
        headers: {
          ...(init?.headers || {}),
          authorization: `DPoP ${token.id_token}`,
          dpop: `${token.dpop}`,
        },
      }).then((res) => {
        logger.debug(`Requested resource '${url.toString()}'`);
        return res;
      });
    };
  }
}
