import {NotFoundHttpError, NotImplementedHttpError, UnauthorizedHttpError} from '@digita-ai/handlersjs-http';
import {ClientIdStrategy} from '../../factory/ClientIdStrategy';
import {AgentRegistrationDiscoveryService} from './AgentRegistrationDiscoveryService';
import {AgentRegistrationDiscoveryServiceImpl} from './AgentRegistrationDiscoveryServiceImpl';
import {RegistrationRequiredError} from './error/RegistrationRequiredError';

const MOCK_REQUEST_URI = 'https://example.org/aa/123';
const MOCK_REGISTRATION_URI = 'https://pod.example.org/alice/registrations/ef283';
const MOCK_OWNER = 'https://pod.example.org/alice/profile';

const MOCK_AGENT_WEBID = 'https://pod.example.org/bob/profile';
const MOCK_AGENT_CLIENT = 'https://app.example.org';

const MOCK_TOKEN_VERIFIER = {
  authenticate: jest.fn(),
};
const MOCK_CLIENTID_STRATEGY = {
  getWebIdForClientId: jest.fn(),
};
const MOCK_AUTHORIZATION_AGENT_FACTORY = {
  getAuthorizationAgent: jest.fn(),
};
const MOCK_AUTHORIZATION_AGENT = {
  findSocialAgentRegistration: jest.fn(),
  findApplicationRegistration: jest.fn(),
};
describe('An AgentRegistrationDiscoveryServiceImpl', () => {
  let service:AgentRegistrationDiscoveryService;

  beforeEach(() => {
    service = new AgentRegistrationDiscoveryServiceImpl(MOCK_TOKEN_VERIFIER,
        (MOCK_CLIENTID_STRATEGY as unknown as ClientIdStrategy),
        MOCK_AUTHORIZATION_AGENT_FACTORY);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should throw an error when WebID cannot be extracted from request URI', async () => {
    MOCK_CLIENTID_STRATEGY.getWebIdForClientId.mockRejectedValueOnce(new Error('invalid'));
    const res = service.handle({
      request_uri: MOCK_REQUEST_URI,
      headers: {},
    });

    await expect(res).rejects.toThrowError(NotFoundHttpError);
    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalled();
    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalledWith(MOCK_REQUEST_URI);
  });

  it('should throw an error when authorization header is missing', async () => {
    MOCK_CLIENTID_STRATEGY.getWebIdForClientId.mockResolvedValueOnce(MOCK_OWNER);
    const res = service.handle({
      request_uri: MOCK_REQUEST_URI,
      headers: {},
    });

    await expect(res).rejects.toThrowError(NotImplementedHttpError);
    await expect(res).rejects.toThrowError('No valid Authorization header specified.');

    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalled();
    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalledWith(MOCK_REQUEST_URI);
  });

  it('should throw an error when authorization header does not start with dpop or bearer', async () => {
    MOCK_CLIENTID_STRATEGY.getWebIdForClientId.mockResolvedValueOnce(MOCK_OWNER);
    const res = service.handle({
      request_uri: MOCK_REQUEST_URI,
      headers: {'authorization': 'abc'},
    });

    await expect(res).rejects.toThrowError(NotImplementedHttpError);
    await expect(res).rejects.toThrowError('No valid Authorization header specified.');

    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalled();
    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalledWith(MOCK_REQUEST_URI);
  });

  it('should throw an error when token verifier throws error', async () => {
    MOCK_CLIENTID_STRATEGY.getWebIdForClientId.mockResolvedValueOnce(MOCK_OWNER);
    MOCK_TOKEN_VERIFIER.authenticate.mockRejectedValueOnce(new UnauthorizedHttpError('invalid'));
    const res = service.handle({
      request_uri: MOCK_REQUEST_URI,
      headers: {'authorization': 'Bearer 123'},
    });

    await expect(res).rejects.toThrowError(UnauthorizedHttpError);
    await expect(res).rejects.toThrowError('invalid');

    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalled();
    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalledWith(MOCK_REQUEST_URI);

    expect(MOCK_TOKEN_VERIFIER.authenticate).toHaveBeenCalled();
    expect(MOCK_TOKEN_VERIFIER.authenticate).toHaveBeenCalledWith({
      method: 'HEAD',
      bearer: '123',
      url: MOCK_REQUEST_URI,
    });
  });

  it('should throw an error when the authorization agent cannot be initialized', async () => {
    MOCK_CLIENTID_STRATEGY.getWebIdForClientId.mockResolvedValueOnce(MOCK_OWNER);
    MOCK_TOKEN_VERIFIER.authenticate.mockResolvedValueOnce({webId: MOCK_AGENT_WEBID, clientId: MOCK_AGENT_CLIENT});
    MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent.mockRejectedValueOnce(new Error('invalid'));

    const res = service.handle({
      request_uri: MOCK_REQUEST_URI,
      headers: {'authorization': 'DPoP 123', 'dpop': '456'},
    });

    await expect(res).rejects.toThrowError(NotFoundHttpError);
    await expect(res).rejects.toThrowError(`No authorization agent for WebID ${MOCK_OWNER}`);

    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalled();
    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalledWith(MOCK_REQUEST_URI);

    expect(MOCK_TOKEN_VERIFIER.authenticate).toHaveBeenCalled();
    expect(MOCK_TOKEN_VERIFIER.authenticate).toHaveBeenCalledWith({
      method: 'HEAD',
      bearer: '123',
      dpop: '456',
      url: MOCK_REQUEST_URI,
    });

    expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalled();
    expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalledWith(MOCK_OWNER);
  });

  it('should throw an error when authenticating as owner without clientId', async () => {
    MOCK_CLIENTID_STRATEGY.getWebIdForClientId.mockResolvedValueOnce(MOCK_OWNER);
    MOCK_TOKEN_VERIFIER.authenticate.mockResolvedValueOnce({webId: MOCK_OWNER});
    MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent.mockResolvedValueOnce(MOCK_AUTHORIZATION_AGENT);

    const res = service.handle({
      request_uri: MOCK_REQUEST_URI,
      headers: {'authorization': 'DPoP 123', 'dpop': '456'},
    });

    await expect(res).rejects.toThrowError(UnauthorizedHttpError);
    await expect(res).rejects.toThrowError('Cannot authenticate owner without clientId as Application');

    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalled();
    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalledWith(MOCK_REQUEST_URI);

    expect(MOCK_TOKEN_VERIFIER.authenticate).toHaveBeenCalled();
    expect(MOCK_TOKEN_VERIFIER.authenticate).toHaveBeenCalledWith({
      method: 'HEAD',
      bearer: '123',
      dpop: '456',
      url: MOCK_REQUEST_URI,
    });

    expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalled();
    expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalledWith(MOCK_OWNER);
  });

  it('should throw an error when no registration exists for agent', async () => {
    MOCK_CLIENTID_STRATEGY.getWebIdForClientId.mockResolvedValueOnce(MOCK_OWNER);
    MOCK_TOKEN_VERIFIER.authenticate.mockResolvedValueOnce({webId: MOCK_OWNER, clientId: MOCK_AGENT_CLIENT});
    MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent.mockResolvedValueOnce(MOCK_AUTHORIZATION_AGENT);
    MOCK_AUTHORIZATION_AGENT.findApplicationRegistration.mockResolvedValueOnce(undefined);

    const res = service.handle({
      request_uri: MOCK_REQUEST_URI,
      headers: {'authorization': 'DPoP 123', 'dpop': '456'},
    });

    await expect(res).rejects.toThrowError(RegistrationRequiredError);
    await expect(res).rejects.toThrowError(`No registration exists for agent "${MOCK_AGENT_CLIENT}"`);

    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalled();
    expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalledWith(MOCK_REQUEST_URI);

    expect(MOCK_TOKEN_VERIFIER.authenticate).toHaveBeenCalled();
    expect(MOCK_TOKEN_VERIFIER.authenticate).toHaveBeenCalledWith({
      method: 'HEAD',
      bearer: '123',
      dpop: '456',
      url: MOCK_REQUEST_URI,
    });

    expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalled();
    expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalledWith(MOCK_OWNER);

    expect(MOCK_AUTHORIZATION_AGENT.findApplicationRegistration).toHaveBeenCalled();
    expect(MOCK_AUTHORIZATION_AGENT.findApplicationRegistration).toHaveBeenCalledWith(MOCK_AGENT_CLIENT);
  });

  describe('when registration exists', () => {
    it('should return application registration iri', async () => {
      MOCK_CLIENTID_STRATEGY.getWebIdForClientId.mockResolvedValueOnce(MOCK_OWNER);
      MOCK_TOKEN_VERIFIER.authenticate.mockResolvedValueOnce({webId: MOCK_OWNER, clientId: MOCK_AGENT_CLIENT});
      MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent.mockResolvedValueOnce(MOCK_AUTHORIZATION_AGENT);
      MOCK_AUTHORIZATION_AGENT.findApplicationRegistration.mockResolvedValueOnce({iri: MOCK_REGISTRATION_URI});

      const res = service.handle({
        request_uri: MOCK_REQUEST_URI,
        headers: {'authorization': 'DPoP 123', 'dpop': '456'},
      });

      await expect(res).resolves.toEqual({agent_registration: MOCK_REGISTRATION_URI, agent_iri: MOCK_AGENT_CLIENT});

      expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalled();
      expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalledWith(MOCK_REQUEST_URI);

      expect(MOCK_TOKEN_VERIFIER.authenticate).toHaveBeenCalled();
      expect(MOCK_TOKEN_VERIFIER.authenticate).toHaveBeenCalledWith({
        method: 'HEAD',
        bearer: '123',
        dpop: '456',
        url: MOCK_REQUEST_URI,
      });

      expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalled();
      expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalledWith(MOCK_OWNER);

      expect(MOCK_AUTHORIZATION_AGENT.findApplicationRegistration).toHaveBeenCalled();
      expect(MOCK_AUTHORIZATION_AGENT.findApplicationRegistration).toHaveBeenCalledWith(MOCK_AGENT_CLIENT);
    });

    it('should return agent registration iri', async () => {
      MOCK_CLIENTID_STRATEGY.getWebIdForClientId.mockResolvedValue(MOCK_OWNER);
      MOCK_TOKEN_VERIFIER.authenticate.mockResolvedValue({webId: MOCK_AGENT_WEBID, clientId: MOCK_AGENT_CLIENT});
      MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent.mockResolvedValue(MOCK_AUTHORIZATION_AGENT);
      MOCK_AUTHORIZATION_AGENT.findSocialAgentRegistration.mockResolvedValue({iri: MOCK_REGISTRATION_URI});

      const res = service.handle({
        request_uri: MOCK_REQUEST_URI,
        headers: {'authorization': 'DPoP 123', 'dpop': '456'},
      });

      await expect(res).resolves.toEqual({agent_registration: MOCK_REGISTRATION_URI, agent_iri: MOCK_AGENT_WEBID});

      expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalled();
      expect(MOCK_CLIENTID_STRATEGY.getWebIdForClientId).toHaveBeenCalledWith(MOCK_REQUEST_URI);

      expect(MOCK_TOKEN_VERIFIER.authenticate).toHaveBeenCalled();
      expect(MOCK_TOKEN_VERIFIER.authenticate).toHaveBeenCalledWith({
        method: 'HEAD',
        bearer: '123',
        dpop: '456',
        url: MOCK_REQUEST_URI,
      });

      expect(MOCK_AUTHORIZATION_AGENT.findSocialAgentRegistration).toHaveBeenCalled();
      expect(MOCK_AUTHORIZATION_AGENT.findSocialAgentRegistration).toHaveBeenCalledWith(MOCK_AGENT_WEBID);

      // Validate caching
      await expect(service.handle({
        request_uri: MOCK_REQUEST_URI,
        headers: {'authorization': 'DPoP 123', 'dpop': '456'},
      })).resolves.toEqual({agent_registration: MOCK_REGISTRATION_URI, agent_iri: MOCK_AGENT_WEBID});

      expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalledTimes(1);
      expect(MOCK_AUTHORIZATION_AGENT_FACTORY.getAuthorizationAgent).toHaveBeenCalledWith(MOCK_OWNER);
    });
  });
});
