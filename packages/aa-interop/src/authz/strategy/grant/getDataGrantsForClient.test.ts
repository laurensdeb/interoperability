import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {MOCK_APPLICATION} from '../../../util/test/MockData';
import {getDataGrantsForClient} from './getDataGrantsForClient';
import {getAccessGrantForClient} from './getAccessGrantForClient';

jest.mock('./getAccessGrantForClient');

const MOCK_BOOTSTRAP = jest.fn();

describe('getDataGrantsForClient', () =>{
  it('Should return data grants when access grant exists', async () => {
    (getAccessGrantForClient as unknown as jest.Mock).mockResolvedValueOnce({
      bootstrap: MOCK_BOOTSTRAP,
      hasDataGrant: [],
    });
    const result = await getDataGrantsForClient(({} as unknown as AuthorizationAgent), MOCK_APPLICATION);
    expect(result).toEqual([]);

    expect(MOCK_BOOTSTRAP).toHaveBeenCalled();
    expect(getAccessGrantForClient).toHaveBeenCalled();
    expect(getAccessGrantForClient).toHaveBeenCalledWith({}, MOCK_APPLICATION);
  });
  it('Should return undefined when no access grant exists', async () => {
    (getAccessGrantForClient as unknown as jest.Mock).mockResolvedValueOnce(undefined);
    const result = await getDataGrantsForClient(({} as unknown as AuthorizationAgent), MOCK_APPLICATION);
    expect(result).toEqual(undefined);

    expect(MOCK_BOOTSTRAP).toHaveBeenCalled();
    expect(getAccessGrantForClient).toHaveBeenCalled();
    expect(getAccessGrantForClient).toHaveBeenCalledWith({}, MOCK_APPLICATION);
  });
});
