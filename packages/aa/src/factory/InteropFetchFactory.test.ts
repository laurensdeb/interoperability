import {InteropFetchFactory} from './InteropFetchFactory';
import {fetch as crossFetch, Response} from 'cross-fetch';
const mockTokenFactory = {getDpop: jest.fn(), getToken: jest.fn()};
jest.mock('cross-fetch', () => {
  const crossFetchModule = jest.requireActual('cross-fetch') as any;
  return {
    ...crossFetchModule,
    fetch: jest.fn(),
  };
});
const mockFetch = (response: Response) => {
  return (
    crossFetch as jest.MockedFunction<typeof crossFetch>
  ).mockResolvedValueOnce(response);
};

const CLIENT_ID = 'https://aa.example.org/client/2ef3b';

const REQUEST_URI = 'https://fake.url';
describe('An InteropFetchFactory', () => {
  const fetchFactory = new InteropFetchFactory(mockTokenFactory);
  it('returns a fetch function which adds the access token to requests', async () => {
    mockTokenFactory.getToken.mockResolvedValueOnce({id_token: 'abc', dpop: '456'});

    const fetchFn = fetchFactory.getAuthenticatedFetch(CLIENT_ID);

    const mockedFetch = mockFetch(new Response(JSON.stringify({})));

    await fetchFn(REQUEST_URI);

    expect(mockedFetch).toHaveBeenCalledWith(REQUEST_URI, {
      headers: {
        authorization: `DPoP abc`,
        dpop: `456`,
      },
    });

    expect(mockTokenFactory.getToken).toHaveBeenCalled();
    expect(mockTokenFactory.getToken).toHaveBeenCalledWith(REQUEST_URI, 'GET', {
      webid: `${CLIENT_ID}/profile`,
      azp: `${CLIENT_ID}/profile`});
  });
  it('returns a fetch function which adds the access token to requests', async () => {
    mockTokenFactory.getToken.mockResolvedValueOnce({id_token: 'abc', dpop: '456'});

    const fetchFn = fetchFactory.getAuthenticatedFetch(CLIENT_ID);

    const mockedFetch = mockFetch(new Response(JSON.stringify({})));

    await fetchFn('https://fake.url', {method: 'POST'});

    expect(mockedFetch).toHaveBeenCalledWith('https://fake.url', {
      headers: {
        authorization: `DPoP abc`,
        dpop: `456`,
      },
    });

    expect(mockTokenFactory.getToken).toHaveBeenCalled();
    expect(mockTokenFactory.getToken).toHaveBeenCalledWith(REQUEST_URI, 'POST', {
      webid: `${CLIENT_ID}/profile`,
      azp: `${CLIENT_ID}/profile`});
  });
});
