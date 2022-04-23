import {TokenFactory} from '../../TokenFactory';
import {UmaFetchFactory} from './UmaFetchFactory';
import {fetch as crossFetch, Response} from 'cross-fetch';
const mockTokenFactory = {serialize: jest.fn(), deserialize: jest.fn()};
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

describe('a UmaFetchFactory', () => {
  const fetchFactory = new UmaFetchFactory((mockTokenFactory as unknown as TokenFactory), 'https://as.example.org');
  it('returns a fetch function which adds the access token to requests', async () => {
    mockTokenFactory.serialize.mockResolvedValueOnce({token: 'abc', type: 'Bearer'});

    const fetchFn = fetchFactory.getAuthenticatedFetch();

    const mockedFetch = mockFetch(new Response(JSON.stringify({})));

    await fetchFn('https://fake.url');

    expect(mockedFetch).toHaveBeenCalledWith('https://fake.url', {
      headers: {
        authorization: `Bearer abc`,
      },
    });
  });
});
