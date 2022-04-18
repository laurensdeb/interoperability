/* eslint-disable require-jsdoc */
import {UmaClient} from './UmaClient';
import {UmaClientImpl} from './UmaClientImpl';
import fetch from 'node-fetch';

jest.mock('node-fetch', () => jest.fn());

const MOCK_AS_URL = 'https://as.example.org';
const BASE_URL = 'https://pods.example.org';
const MOCK_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
      MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgDr/w3aMO+Vib5zI6
      kRiJR3dD65qfE3X49PpSwR1efl+hRANCAATm5Yfzq2SK1tEFKwCWV6qIfgReMioJ
      oJJP7CSASenY6GuRl1ovbE2AgB1kmjFDu6LKT0ATxEZpBdaZW453br4L
      -----END PRIVATE KEY-----
      `;
const MOCK_CONFIG = {
  issuer: MOCK_AS_URL,
  jwks_uri: `${MOCK_AS_URL}/jwks`,
  permission_registration_endpoint: `${MOCK_AS_URL}/register`,
};

describe('A UmaClientImpl', () => {
  let umaClient: UmaClient;

  beforeAll(() => {
    umaClient = new UmaClientImpl({
      asUrl: MOCK_AS_URL,
      baseUrl: BASE_URL,
      maxTokenAge: 600,
      credentials: {
        ecAlgorithm: 'ES256',
        ecPrivateKey: MOCK_PRIVATE_KEY,
      },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return the authorization service URL', () => {
    expect(umaClient.getAsUrl()).toBe(MOCK_AS_URL);
  });

  describe('when the UMA configuration is requested', () => {
    it('and configuration is valid, should return configuration', async () => {
      (fetch as unknown as jest.Mock).mockImplementation(async () => {
        return {
          ok: true,
          status: 200,
          json: async () => {
            return MOCK_CONFIG;
          },
        };
      },
      );

      expect(await umaClient.fetchUMAConfig()).toEqual(MOCK_CONFIG);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(`${MOCK_AS_URL}/.well-known/uma2-configuration`, undefined);
    });

    it('and configuration is invalid, should throw error', async () => {
      (fetch as unknown as jest.Mock).mockImplementation(async () => {
        return {
          ok: true,
          status: 200,
          json: async () => {
            return {};
          },
        };
      },
      );

      expect(async () => await umaClient.fetchUMAConfig()).rejects.toThrowError('The UMA Configuration for Authorization Server \'https://as.example.org\' is missing required attributes \'jwks_uri\', \'issuer\' or \'permission_registration_endpoint\'');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(`${MOCK_AS_URL}/.well-known/uma2-configuration`, undefined);
    });

    it('and configuration is unavailable, should throw error', async () => {
      (fetch as unknown as jest.Mock).mockImplementation(async () => {
        return {
          ok: false,
          status: 404,
          json: async () => {
            return {};
          },
        };
      },
      );

      expect(async () => await umaClient.fetchUMAConfig()).rejects.toThrowError('Unable to retrieve UMA Configuration for Authorization Server \'https://as.example.org\'');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(`${MOCK_AS_URL}/.well-known/uma2-configuration`, undefined);
    });
  });
});
