import {UnauthorizedHttpError} from '@digita-ai/handlersjs-http';
import {DummyTokenVerifier} from './DummyTokenVerifier';

const MOCK_URL = 'https://example.org/token';

const claimTokenProcessor = new DummyTokenVerifier();
describe('Unhappy Flows', () => {
  test('Should throw error for invalid formatted token', async () => {
    const res = claimTokenProcessor.authenticate({
      url: MOCK_URL,
      method: 'POST',
      bearer: 'abc:def:ghi',
    });
    expect(res).rejects.toThrowError('Error verifying Access Token via WebID: ' +
    'Invalid token format, only one \':\' is expected.');
    expect(res).rejects.toThrow(UnauthorizedHttpError);
  });
  test('Should throw error for non-URL WebID', async () => {
    const res = claimTokenProcessor.authenticate({
      url: MOCK_URL,
      method: 'POST',
      bearer: `abc:${encodeURIComponent('https://example.org/app')}`,
    });
    expect(res).rejects.toThrowError('Error verifying Access Token via WebID: ' +
    'Invalid URL');
    expect(res).rejects.toThrow(UnauthorizedHttpError);
  });
  test('Should throw error for non-URL ClientID', async () => {
    const res = claimTokenProcessor.authenticate({
      url: MOCK_URL,
      method: 'POST',
      bearer: `${encodeURIComponent('https://example.org/id')}:abc`,
    });
    expect(res).rejects.toThrowError('Error verifying Access Token via WebID: ' +
    'Invalid URL');
    expect(res).rejects.toThrow(UnauthorizedHttpError);
  });
});

describe('Happy Flows', () => {
  test('Valid token should return Principal', async () => {
    expect(await claimTokenProcessor.authenticate({
      url: MOCK_URL,
      method: 'POST',
      bearer: `${encodeURIComponent('https://example.org/id')}:${encodeURIComponent('https://example.org/app')}`,
    })).toEqual({webId: 'https://example.org/id', clientId: 'https://example.org/app'});
  });
  test('Valid token without ClientId should return Principal', async () => {
    expect(await claimTokenProcessor.authenticate({
      url: MOCK_URL,
      method: 'POST',
      bearer: `${encodeURIComponent('https://example.org/id')}`,
    })).toEqual({webId: 'https://example.org/id'});
  });
});
