import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {MOCK_APPLICATION, MOCK_REQUEST, MOCK_RESOURCE} from '../../../../util/test/MockData';
import {DataRegistrationStrategy} from './DataRegistrationStrategy';
import {getDataGrantsForClient} from '../../grant/getDataGrantsForClient';

jest.mock('../../grant/getDataGrantsForClient');

const MOCK_AA_FACTORY = {
  getAuthorizationAgent: jest.fn(),
};

const MOCK_AUTHORIZATION_AGENT = {
  findSocialAgentRegistration: jest.fn(),
  findApplicationRegistration: jest.fn(),
};

describe('A DataRegistrationStrategy', () => {
  const strategy = new DataRegistrationStrategy(MOCK_AA_FACTORY);

  beforeEach(() => {
    MOCK_AA_FACTORY.getAuthorizationAgent.mockImplementation(async () => MOCK_AUTHORIZATION_AGENT);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should authorize access to the data registration related to a data grant with read permissions', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce([{
      hasDataRegistration: MOCK_RESOURCE,
    }]);
    expect(await strategy.authorize(MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set([AccessMode.read]));

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });

  it('should not authorize with read permissions when no data grants exists', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce([]);
    expect(await strategy.authorize(MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set());

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });

  it('should not authorize with read permissions when no access grant exists', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce(undefined);
    expect(await strategy.authorize(MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set());

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });

  it('should not authorize with read permissions when no matching data grant exists', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce([{
    }]);
    expect(await strategy.authorize(MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set());

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });
});
