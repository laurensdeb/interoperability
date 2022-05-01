import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {MOCK_APPLICATION, MOCK_REQUEST, MOCK_RESOURCE} from '../../../util/test/MockData';
import {AccessGrantStrategy} from './AccessGrantStrategy';
import {getAccessGrantForClient} from './getAccessGrantForClient';

jest.mock('./getAccessGrantForClient');


const MOCK_AUTHORIZATION_AGENT = {
  findSocialAgentRegistration: jest.fn(),
  findApplicationRegistration: jest.fn(),
};

describe('An AccessGrantStrategy', () => {
  const strategy = new AccessGrantStrategy();

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should authorize with read permissions when access grant is fetched', async () => {
    (getAccessGrantForClient as unknown as jest.Mock).mockResolvedValueOnce({
      iri: MOCK_RESOURCE,
    });
    expect(await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set([AccessMode.read]));

    expect(getAccessGrantForClient).toHaveBeenCalled();
    expect(getAccessGrantForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });

  it('should not authorize with read permissions when no access grant exists', async () => {
    (getAccessGrantForClient as unknown as jest.Mock).mockResolvedValueOnce(undefined);
    expect(await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent)
        , MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set());

    expect(getAccessGrantForClient).toHaveBeenCalled();
    expect(getAccessGrantForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });
});
