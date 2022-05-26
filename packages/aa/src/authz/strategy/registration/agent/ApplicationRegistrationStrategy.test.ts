import {ApplicationRegistrationStrategy} from './ApplicationRegistrationStrategy';
import {APP_CLIENTID, MOCK_APPLICATION, MOCK_REQUEST,
  MOCK_RESOURCE, MOCK_SOCIAL_AGENT} from '../../../../util/test/MockData';
import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {AccessMode} from '@thundr-be/sai-helpers';

const MOCK_FIND_APPLICATION_REGISTRATION = jest.fn();

const MOCK_AUTHORIZATION_AGENT = {
  findApplicationRegistration: MOCK_FIND_APPLICATION_REGISTRATION,
};

describe('An ApplicationRegistrationStrategy', () =>{
  let strategy = new ApplicationRegistrationStrategy();

  beforeEach(() => {
    strategy = new ApplicationRegistrationStrategy();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should authorize an Application\'s request to the application\'s registration', async () =>{
    MOCK_FIND_APPLICATION_REGISTRATION.mockResolvedValueOnce({
      iri: MOCK_RESOURCE,
      registeredAgent: APP_CLIENTID,
    });

    const result = await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_REQUEST, MOCK_APPLICATION);
    expect(result).toEqual(new Set([AccessMode.read]));

    expect(MOCK_FIND_APPLICATION_REGISTRATION).toHaveBeenCalled();
    expect(MOCK_FIND_APPLICATION_REGISTRATION).toHaveBeenCalledWith(APP_CLIENTID);
  });


  it('should not authorize an Application\'s request if no application registration exists', async () =>{
    MOCK_FIND_APPLICATION_REGISTRATION.mockResolvedValueOnce(undefined);

    const result = await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_REQUEST, MOCK_APPLICATION);
    expect(result).toEqual(new Set());

    expect(MOCK_FIND_APPLICATION_REGISTRATION).toHaveBeenCalled();
    expect(MOCK_FIND_APPLICATION_REGISTRATION).toHaveBeenCalledWith(APP_CLIENTID);
  });

  it('should not authorize a Social Agent\'s request to an application\'s registration', async () =>{
    MOCK_FIND_APPLICATION_REGISTRATION.mockResolvedValueOnce({
      iri: MOCK_RESOURCE,
      registeredAgent: APP_CLIENTID,
    });

    const result = await strategy.authorize((MOCK_AUTHORIZATION_AGENT as unknown as AuthorizationAgent),
        MOCK_REQUEST, MOCK_SOCIAL_AGENT);
    expect(result).toEqual(new Set());

    expect(MOCK_FIND_APPLICATION_REGISTRATION).toHaveBeenCalledTimes(0);
  });
});
