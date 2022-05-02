import {SocialAgentRegistrationStrategy} from './SocialAgentRegistrationStrategy';
import {MOCK_APPLICATION, MOCK_REQUEST,
  MOCK_RESOURCE, MOCK_SOCIAL_AGENT, WEBID_BOB} from '../../../../util/test/MockData';
import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {AccessMode} from '@thundr-be/sai-helpers';

const MOCK_FIND_SOCIAL_AGENT_REGISTRATION = jest.fn();

const MOCK_AUTHORIZATION_AGENT = {
  findSocialAgentRegistration: MOCK_FIND_SOCIAL_AGENT_REGISTRATION,
};

describe('A SocialAgentRegistrationStrategy', () =>{
  const strategy = new SocialAgentRegistrationStrategy();

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should authorize an Social Agent\'s request to the Agent\'s registration', async () =>{
    MOCK_FIND_SOCIAL_AGENT_REGISTRATION.mockResolvedValueOnce({
      iri: MOCK_RESOURCE,
      registeredAgent: WEBID_BOB,
    });

    const result = await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_REQUEST, MOCK_SOCIAL_AGENT);
    expect(result).toEqual(new Set([AccessMode.read]));

    expect(MOCK_FIND_SOCIAL_AGENT_REGISTRATION).toHaveBeenCalled();
    expect(MOCK_FIND_SOCIAL_AGENT_REGISTRATION).toHaveBeenCalledWith(WEBID_BOB);
  });

  it('should not authorize an Social Agent\'s request if no registration exists', async () =>{
    MOCK_FIND_SOCIAL_AGENT_REGISTRATION.mockResolvedValueOnce(undefined);

    const result = await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_REQUEST, MOCK_SOCIAL_AGENT);
    expect(result).toEqual(new Set([]));

    expect(MOCK_FIND_SOCIAL_AGENT_REGISTRATION).toHaveBeenCalled();
    expect(MOCK_FIND_SOCIAL_AGENT_REGISTRATION).toHaveBeenCalledWith(WEBID_BOB);
  });


  it('should not authorize a Application\'s request to a Social Agent\'s registration', async () =>{
    MOCK_FIND_SOCIAL_AGENT_REGISTRATION.mockResolvedValueOnce({
      iri: MOCK_RESOURCE,
      registeredAgent: WEBID_BOB,
    });

    const result = await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_REQUEST, MOCK_APPLICATION);
    expect(result).toEqual(new Set());


    expect(MOCK_FIND_SOCIAL_AGENT_REGISTRATION).toHaveBeenCalledTimes(0);
  });
});
