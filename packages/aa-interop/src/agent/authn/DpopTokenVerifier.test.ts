import {UnauthorizedHttpError} from '@digita-ai/handlersjs-http';
import {createSolidTokenVerifier} from '@solid/access-token-verifier';
import {DpopTokenVerifier} from './DpopTokenVerifier';

const solidTokenVerifier = createSolidTokenVerifier() as jest.MockedFunction<any>;

describe('Unhappy Flows', () => {
  const verifier = new DpopTokenVerifier();
  beforeEach((): void => {
    jest.clearAllMocks();
  });


  test('Should throw error for missing DPoP', async () => {
    const res = verifier.authenticate({
      bearer: 'token-123',
      url: 'http://example.com/token',
      method: 'POST'});
    expect(res).rejects.toThrowError('DPoP Header is missing.');
    expect(res).rejects.toThrow(UnauthorizedHttpError);
  });
  test('When token verifier throws error, should throw error as well.', async () => {
    solidTokenVerifier.mockImplementationOnce((): void => {
      throw new Error('invalid');
    });
    const res = verifier.authenticate({
      bearer: 'token-123',
      url: 'http://example.com/token',
      dpop: 'token-456',
      method: 'POST'});
    expect(res).rejects.toThrowError('Error verifying Access Token via WebID: invalid');
    expect(res).rejects.toThrow(UnauthorizedHttpError);
  });
});


describe('Happy Flows', () => {
  const verifier = new DpopTokenVerifier();
  beforeEach((): void => {
    jest.clearAllMocks();
  });

  test('Should call token verifier', async () => {
    const result = await verifier.authenticate({
      bearer: 'token-123',
      dpop: 'token-456',
      url: 'http://example.com/token', method: 'POST'});
    expect(solidTokenVerifier).toHaveBeenCalledTimes(1);
    expect(solidTokenVerifier).toHaveBeenCalledWith('DPoP token-123', {header: 'token-456', method: 'POST', url: 'http://example.com/token'});
    expect(result).toEqual({webId: 'http://alice.example/card#me', clientId: 'http://example.com/app'});
  });
});
