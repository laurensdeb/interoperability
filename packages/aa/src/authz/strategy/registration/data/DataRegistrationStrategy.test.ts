import {AccessMode} from '@thundr-be/sai-helpers';
import {MOCK_APPLICATION, MOCK_REQUEST, MOCK_RESOURCE} from '../../../../util/test/MockData';
import {DataRegistrationStrategy} from './DataRegistrationStrategy';
import {getDataGrantsForClient} from '../../grant/getDataGrantsForClient';
import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';

jest.mock('../../grant/getDataGrantsForClient');


const MOCK_AUTHORIZATION_AGENT = {
  findSocialAgentRegistration: jest.fn(),
  findApplicationRegistration: jest.fn(),
};

describe('A DataRegistrationStrategy', () => {
  const strategy = new DataRegistrationStrategy();

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should authorize access to the data registration related to a data grant with read permissions', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce([{
      hasDataRegistration: MOCK_RESOURCE,
      accessMode: [AccessMode.read],
    }]);
    expect(await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set([AccessMode.read]));

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });

  it('should authorize access to the data registration related read and append permissions', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce([{
      hasDataRegistration: MOCK_RESOURCE,
      accessMode: [AccessMode.read, AccessMode.append],
    }]);
    expect(await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set([AccessMode.read, AccessMode.append]));

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });


  it('should not authorize with read permissions when no data grants exists', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce([]);
    expect(await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set());

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });

  it('should not authorize with read permissions when no access grant exists', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce(undefined);
    expect(await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set());

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });

  it('should not authorize with read permissions when no matching data grant exists', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce([{
    }]);
    expect(await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set());

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });
});
