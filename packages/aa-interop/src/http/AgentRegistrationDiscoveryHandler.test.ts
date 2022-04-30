import {AgentRegistrationDiscoveryHander} from './AgentRegistrationDiscoveryHandler';
import {lastValueFrom} from 'rxjs';

const MOCK_SERVICE = {
  handle: jest.fn(),
};
const MOCK_URL = new URL('https://example.org/aa/123');
const MOCK_AGENT = 'https://app.example.com';
const MOCK_REGISTRATION = 'https://pod.example.com/registrations/123';

describe('An AgentRegistrationDiscoveryHandler', () => {
  const handler = new AgentRegistrationDiscoveryHander(MOCK_SERVICE);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should require an authorization header', async () => {
    const res = lastValueFrom(handler.handle({
      request: {
        method: 'HEAD',
        url: new URL('https://example.org/aa/123'),
        headers: {},
      },
    }));
    expect(res).rejects.toThrowError('Missing "Authorization"-header in request.');
    expect(MOCK_SERVICE.handle).toHaveBeenCalledTimes(0);
  });

  it('should pass on error from service', async () => {
    MOCK_SERVICE.handle.mockRejectedValueOnce(new Error('invalid'));
    const res = lastValueFrom(handler.handle({
      request: {
        method: 'HEAD',
        url: new URL('https://example.org/aa/123'),
        headers: {'authorization': 'Bearer 123'},
      },
    }));
    expect(res).rejects.toThrowError('invalid');
    expect(MOCK_SERVICE.handle).toHaveBeenCalled();
    expect(MOCK_SERVICE.handle).toHaveBeenCalledWith({headers: {'authorization': 'Bearer 123'},
      request_uri: MOCK_URL.toString()});
  });
  it('Should return the agent registration URI as a link header when successful', async () => {
    MOCK_SERVICE.handle.mockResolvedValueOnce({agent_iri: MOCK_AGENT, agent_registration: MOCK_REGISTRATION});
    const res = await lastValueFrom(handler.handle({
      request: {
        method: 'HEAD',
        url: new URL('https://example.org/aa/123'),
        headers: {'authorization': 'Bearer 123'},
      },
    }));
    expect(res.status).toBe(200);
    expect(res.headers.link).toEqual('<https://app.example.com>; anchor="https://pod.example.com/registrations/123"; rel="http://www.w3.org/ns/solid/interop#registeredAgent"');
    expect(MOCK_SERVICE.handle).toHaveBeenCalled();
    expect(MOCK_SERVICE.handle).toHaveBeenCalledWith({headers: {'authorization': 'Bearer 123'},
      request_uri: MOCK_URL.toString()});
  });
});
