import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {MOCK_APPLICATION, MOCK_SOCIAL_AGENT} from '../../../util/test/MockData';
import {getAccessGrantForClient} from './getAccessGrantForClient';

const MOCK_AUTHORIZATION_AGENT = {
  findSocialAgentRegistration: jest.fn(),
  findApplicationRegistration: jest.fn(),
};
describe('getAccessGrantsForClient', () =>{
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should return access grant for social agent with registration', async () => {
    MOCK_AUTHORIZATION_AGENT.findSocialAgentRegistration.mockResolvedValueOnce({
      accessGrant: {},
    });
    const accessGrant = await getAccessGrantForClient((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_SOCIAL_AGENT);
    expect(accessGrant).toEqual({});

    expect(MOCK_AUTHORIZATION_AGENT.findSocialAgentRegistration).toHaveBeenCalled();
    expect(MOCK_AUTHORIZATION_AGENT.findSocialAgentRegistration).toHaveBeenCalledWith(MOCK_SOCIAL_AGENT.webId);
  });
  it('should return undefined for social agent without registration', async () => {
    const accessGrant = await getAccessGrantForClient((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_SOCIAL_AGENT);
    expect(accessGrant).toBeUndefined();

    expect(MOCK_AUTHORIZATION_AGENT.findSocialAgentRegistration).toHaveBeenCalled();
    expect(MOCK_AUTHORIZATION_AGENT.findSocialAgentRegistration).toHaveBeenCalledWith(MOCK_SOCIAL_AGENT.webId);
  });
  it('should return access grant for application with registration', async () => {
    MOCK_AUTHORIZATION_AGENT.findApplicationRegistration.mockResolvedValueOnce({
      accessGrant: {},
    });
    const accessGrant = await getAccessGrantForClient((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_APPLICATION);
    expect(accessGrant).toEqual({});

    expect(MOCK_AUTHORIZATION_AGENT.findApplicationRegistration).toHaveBeenCalled();
    expect(MOCK_AUTHORIZATION_AGENT.findApplicationRegistration).toHaveBeenCalledWith(MOCK_APPLICATION.clientId);
  });
  it('should return undefined for application without registration', async () => {
    const accessGrant = await getAccessGrantForClient((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_APPLICATION);
    expect(accessGrant).toBeUndefined();

    expect(MOCK_AUTHORIZATION_AGENT.findApplicationRegistration).toHaveBeenCalled();
    expect(MOCK_AUTHORIZATION_AGENT.findApplicationRegistration).toHaveBeenCalledWith(MOCK_APPLICATION.clientId);
  });
});
