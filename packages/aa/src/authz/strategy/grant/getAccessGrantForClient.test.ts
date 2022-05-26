import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {APP_CLIENTID, MOCK_APPLICATION, MOCK_SOCIAL_AGENT, WEBID_BOB} from '../../../util/test/MockData';
import {Application, SocialAgent} from '../Types';
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
        new SocialAgent(WEBID_BOB));
    expect(accessGrant).toEqual({});

    expect(MOCK_AUTHORIZATION_AGENT.findSocialAgentRegistration).toHaveBeenCalled();
    expect(MOCK_AUTHORIZATION_AGENT.findSocialAgentRegistration).toHaveBeenCalledWith(MOCK_SOCIAL_AGENT.webId);
  });
  it('should return undefined for social agent without registration', async () => {
    const accessGrant = await getAccessGrantForClient((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        new SocialAgent(WEBID_BOB + '#me'));
    expect(accessGrant).toBeUndefined();

    expect(MOCK_AUTHORIZATION_AGENT.findSocialAgentRegistration).toHaveBeenCalled();
    expect(MOCK_AUTHORIZATION_AGENT.findSocialAgentRegistration).toHaveBeenCalledWith(WEBID_BOB + '#me');
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
        new Application(WEBID_BOB + '#me', APP_CLIENTID + '#1'));
    expect(accessGrant).toBeUndefined();

    expect(MOCK_AUTHORIZATION_AGENT.findApplicationRegistration).toHaveBeenCalled();
    expect(MOCK_AUTHORIZATION_AGENT.findApplicationRegistration).toHaveBeenCalledWith(APP_CLIENTID + '#1');
  });
});
