import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {APP_CLIENTID, MOCK_RESOURCE, WEBID_ALICE, WEBID_BOB} from '../util/test/MockData';
import {InteropAuthorizer} from './InteropAuthorizer';
import {InteropBaseAuthorizerStrategy} from './strategy/InteropBaseAuthorizerStrategy';

const MOCK_AUTHORIZATION_STRATEGY = {
  authorize: jest.fn(),
};
const MOCK_FIND_SOCIAL_AGENT_REGISTRATION = jest.fn();
const MOCK_FIND_APP_REGISTRATION = jest.fn();

const MOCK_AUTHORIZATION_AGENT_FACTORY = {
  getAuthorizationAgent: jest.fn(),
};

describe('An InteropAuthorizer', () => {
  beforeEach(() => {
    MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent.mockImplementation(async () => {
      return {
        findSocialAgentRegistration: MOCK_FIND_SOCIAL_AGENT_REGISTRATION,
        findApplicationRegistration: MOCK_FIND_APP_REGISTRATION,
      } as unknown as AuthorizationAgent;
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const interopAuthorizer = new InteropAuthorizer(
      [MOCK_AUTHORIZATION_STRATEGY as unknown as InteropBaseAuthorizerStrategy],
      MOCK_AUTHORIZATION_AGENT_FACTORY);

  it('should not authorize a request for Application when no clientId is present', async () => {
    const result = await interopAuthorizer.authorize({webId: WEBID_ALICE},
        {sub: {iri: MOCK_RESOURCE}, owner: WEBID_ALICE, requested: new Set([AccessMode.read])});
    expect(result).toEqual(new Set());
    expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalledTimes(0);
  });

  it('should not authorize a request for an Application without registration', async () => {
    MOCK_FIND_APP_REGISTRATION.mockResolvedValueOnce(undefined);
    const result = await interopAuthorizer.authorize({webId: WEBID_ALICE, clientId: APP_CLIENTID},
        {sub: {iri: MOCK_RESOURCE}, owner: WEBID_ALICE, requested: new Set([AccessMode.read])});

    expect(result).toEqual(new Set());
    expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalledTimes(1);
    expect(MOCK_FIND_APP_REGISTRATION).toHaveBeenCalled();
    expect(MOCK_FIND_APP_REGISTRATION).toHaveBeenCalledWith(APP_CLIENTID);
  });

  it('should not authorize a request for a Social Agent without registration', async () => {
    MOCK_FIND_SOCIAL_AGENT_REGISTRATION.mockResolvedValueOnce(undefined);
    const result = await interopAuthorizer.authorize({webId: WEBID_BOB, clientId: APP_CLIENTID},
        {sub: {iri: MOCK_RESOURCE}, owner: WEBID_ALICE, requested: new Set([AccessMode.read])});

    expect(result).toEqual(new Set());
    expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalledTimes(1);
    expect(MOCK_FIND_SOCIAL_AGENT_REGISTRATION).toHaveBeenCalled();
    expect(MOCK_FIND_SOCIAL_AGENT_REGISTRATION).toHaveBeenCalledWith(WEBID_BOB);
  });

  it('should authorize a request for a Application with registration', async () => {
    MOCK_FIND_APP_REGISTRATION.mockResolvedValueOnce({iri: 'https://example.com'});
    MOCK_AUTHORIZATION_STRATEGY.authorize.mockResolvedValueOnce(new Set([AccessMode.read]));
    const result = await interopAuthorizer.authorize({webId: WEBID_ALICE, clientId: APP_CLIENTID},
        {sub: {iri: MOCK_RESOURCE}, owner: WEBID_ALICE, requested: new Set([AccessMode.read])});

    expect(result).toEqual(new Set([AccessMode.read]));
    expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalledTimes(1);
    expect(MOCK_FIND_APP_REGISTRATION).toHaveBeenCalled();
    expect(MOCK_FIND_APP_REGISTRATION).toHaveBeenCalledWith(APP_CLIENTID);
  });

  it('should authorize a request for a Social Agent with registration', async () => {
    MOCK_FIND_SOCIAL_AGENT_REGISTRATION.mockResolvedValueOnce({iri: 'https://example.com'});
    MOCK_AUTHORIZATION_STRATEGY.authorize.mockResolvedValueOnce(new Set([AccessMode.read]));
    const result = await interopAuthorizer.authorize({webId: WEBID_BOB, clientId: APP_CLIENTID},
        {sub: {iri: MOCK_RESOURCE}, owner: WEBID_ALICE, requested: new Set([AccessMode.read])});

    expect(result).toEqual(new Set([AccessMode.read]));
    expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalledTimes(1);
    expect(MOCK_FIND_SOCIAL_AGENT_REGISTRATION).toHaveBeenCalled();
    expect(MOCK_FIND_SOCIAL_AGENT_REGISTRATION).toHaveBeenCalledWith(WEBID_BOB);
  });

  it('should ignore when error is thrown in strategy', async () => {
    MOCK_FIND_SOCIAL_AGENT_REGISTRATION.mockResolvedValueOnce({iri: 'https://example.com'});
    MOCK_AUTHORIZATION_STRATEGY.authorize.mockRejectedValueOnce(new Error('invalid'));
    const result = await interopAuthorizer.authorize({webId: WEBID_BOB, clientId: APP_CLIENTID},
        {sub: {iri: MOCK_RESOURCE}, owner: WEBID_ALICE, requested: new Set([AccessMode.read])});

    expect(result).toEqual(new Set([]));
    expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalledTimes(1);
    expect(MOCK_FIND_SOCIAL_AGENT_REGISTRATION).toHaveBeenCalled();
    expect(MOCK_FIND_SOCIAL_AGENT_REGISTRATION).toHaveBeenCalledWith(WEBID_BOB);
  });
});
