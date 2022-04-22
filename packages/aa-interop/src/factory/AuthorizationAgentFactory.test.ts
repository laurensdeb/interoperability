import {AuthorizationAgentFactoryImpl} from './AuthorizationAgentFactory';
import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {randomUUID} from 'crypto';


jest.mock('@janeirodigital/interop-authorization-agent');

const MOCK_FETCH_FACTORY = {
  getAuthenticatedFetch: jest.fn(),
};

const MOCK_CLIENTID_STRATEGY = {
  getClientIdForWebId: jest.fn(),
  getWebIdForClientId: jest.fn(),
};
const MOCK_WEBID = 'https://example.org/profiles/123';

describe('An AuthorizationAgentFactoryImpl', () => {
  const authorizationAgentFactory = new AuthorizationAgentFactoryImpl(MOCK_FETCH_FACTORY, MOCK_CLIENTID_STRATEGY);

  it('should yield a new Authorization Agent', async () => {
    await authorizationAgentFactory.getAuthorizationAgent('https://example.org/profiles/123');
    expect(AuthorizationAgent.build as jest.Mock).toHaveBeenCalled();
    expect(AuthorizationAgent.build).toHaveBeenCalledWith(MOCK_WEBID, undefined, {
      randomUUID,
      fetch: undefined,
    });

    expect(MOCK_FETCH_FACTORY.getAuthenticatedFetch).toHaveBeenCalled();

    expect(MOCK_CLIENTID_STRATEGY.getClientIdForWebId).toHaveBeenCalled();
    expect(MOCK_CLIENTID_STRATEGY.getClientIdForWebId).toHaveBeenCalledWith(MOCK_WEBID);
  });
});
