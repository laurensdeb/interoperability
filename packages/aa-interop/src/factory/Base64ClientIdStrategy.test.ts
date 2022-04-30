import {RoutePath} from '@laurensdeb/authorization-agent-helpers';
import {Base64ClientIdStrategy} from './Base64ClientIdStrategy';

const MOCK_WEBID = 'https://id.example.org/profile/123';
const MOCK_CLIENTID = 'https://example.org/aa/clients/aHR0cHM6Ly9pZC5leGFtcGxlLm9yZy9wcm9maWxlLzEyMw==';
const MOCK_AA_BASE = 'https://example.org/aa';
const MOCK_AA_CLIENT_PATH = '/clients/';

describe('A Base64ClientIdStrategy', () => {
  const clientIdStrategy = new Base64ClientIdStrategy(new RoutePath(MOCK_AA_BASE, MOCK_AA_CLIENT_PATH));

  it('should convert a WebID to a ClientID', async () => {
    const clientId = await clientIdStrategy.getClientIdForWebId(MOCK_WEBID);
    expect(clientId).toBeTruthy();
    expect(typeof clientId).toEqual('string');
    expect(clientId).toEqual('https://example.org/aa/clients/aHR0cHM6Ly9pZC5leGFtcGxlLm9yZy9wcm9maWxlLzEyMw==');
  });

  it('should convert a ClientID to a WebID', async () => {
    const webId = await clientIdStrategy.getWebIdForClientId(MOCK_CLIENTID);
    expect(webId).toBeTruthy();
    expect(typeof webId).toEqual('string');
    expect(webId).toEqual(MOCK_WEBID);
  });

  it('should throw an error for an invalid ClientID', async () => {
    expect(async () => await clientIdStrategy.getWebIdForClientId('https://example.org/abc/def')).rejects.toThrowError('ClientID was not generated using this ClientIdStrategy');
  });

  it('should throw an error for a non-Base64 ClientID', async () => {
    expect(async () => await clientIdStrategy.getWebIdForClientId('https://example.org/aa/clients/')).rejects.toThrowError('ClientID was not generated using this ClientIdStrategy');
  });
});
