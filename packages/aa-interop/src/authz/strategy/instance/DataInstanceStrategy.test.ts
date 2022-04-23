import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {MOCK_APPLICATION, MOCK_REQUEST, MOCK_RESOURCE} from '../../../util/test/MockData';
import {DataInstanceStrategy} from './DataInstanceStrategy';
import {getDataGrantsForClient} from '../grant/getDataGrantsForClient'; ;

jest.mock('../grant/getDataGrantsForClient');

const MOCK_AA_FACTORY = {
  getAuthorizationAgent: jest.fn(),
};

const MOCK_AUTHORIZATION_AGENT = {
  findSocialAgentRegistration: jest.fn(),
  findApplicationRegistration: jest.fn(),
};

const yieldMockDataGrant = (instances: any[]) => {
  return {
    getDataInstanceIterator: () => {
      return {
        async* [Symbol.asyncIterator]() {
          for (const instance of instances) {
            yield instance;
          }
        },
      };
    },
  };
};

describe('A DataInstanceStrategy', () => {
  const strategy = new DataInstanceStrategy(MOCK_AA_FACTORY);

  beforeEach(() => {
    MOCK_AA_FACTORY.getAuthorizationAgent.mockImplementation(async () => MOCK_AUTHORIZATION_AGENT);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should authorize with permissions of grant when a data instance is fetched', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce([
      yieldMockDataGrant([{iri: MOCK_RESOURCE, accessMode: [AccessMode.read, AccessMode.write]}]),
    ]);
    expect(await strategy.authorize(MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set([AccessMode.read]));

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });

  it('should ignore additional modes from the interoperability specification', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce([
      yieldMockDataGrant([{iri: MOCK_RESOURCE, accessMode: [AccessMode.read, AccessMode.write, 'http://www.w3.org/ns/auth/acl#Update']}]),
    ]);
    expect(await strategy.authorize(MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set([AccessMode.read]));

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });

  it('should not authorize when instance iri differs', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce([
      yieldMockDataGrant([{iri: 'https://pod.example.org/bob/123', accessMode: [AccessMode.read, AccessMode.write]}]),
    ]);
    expect(await strategy.authorize(MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set([]));

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });

  it('should not authorize when no data grants exist', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce([]);
    expect(await strategy.authorize(MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set([]));

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });

  it('should not authorize when no access grant exist', async () => {
    (getDataGrantsForClient as unknown as jest.Mock).mockResolvedValueOnce(undefined);
    expect(await strategy.authorize(MOCK_REQUEST, MOCK_APPLICATION)).toEqual(new Set([]));

    expect(getDataGrantsForClient).toHaveBeenCalled();
    expect(getDataGrantsForClient).toHaveBeenCalledWith(MOCK_AUTHORIZATION_AGENT, MOCK_APPLICATION);
  });
});
