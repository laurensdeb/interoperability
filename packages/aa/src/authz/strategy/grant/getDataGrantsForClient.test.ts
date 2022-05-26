import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';
import {MOCK_APPLICATION} from '../../../util/test/MockData';
import {getDataGrantsForClient} from './getDataGrantsForClient';
import {getAccessGrantForClient} from './getAccessGrantForClient';

jest.mock('./getAccessGrantForClient');


describe('getDataGrantsForClient', () =>{
  it('Should return data grants when access grant exists', async () => {
    (getAccessGrantForClient as unknown as jest.Mock).mockResolvedValueOnce({
      hasDataGrant: [],
    });
    const result = await getDataGrantsForClient(({} as unknown as AuthorizationAgent), MOCK_APPLICATION);
    expect(result).toEqual([]);

    expect(getAccessGrantForClient).toHaveBeenCalled();
    expect(getAccessGrantForClient).toHaveBeenCalledWith({}, MOCK_APPLICATION);
  });
  it('Should return undefined when no access grant exists', async () => {
    (getAccessGrantForClient as unknown as jest.Mock).mockResolvedValueOnce(undefined);
    const result = await getDataGrantsForClient(({} as unknown as AuthorizationAgent), MOCK_APPLICATION);
    expect(result).toEqual(undefined);

    expect(getAccessGrantForClient).toHaveBeenCalled();
    expect(getAccessGrantForClient).toHaveBeenCalledWith({}, MOCK_APPLICATION);
  });
});
