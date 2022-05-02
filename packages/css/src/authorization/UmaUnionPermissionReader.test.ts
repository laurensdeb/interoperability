import {CredentialGroup} from '../authentication/Credentials';
import {PermissionReader, PermissionReaderInput} from './PermissionReader';
import {UmaUnionPermissionReader} from './UmaUnionPermissionReader';

describe('A UnionPermissionReader', (): void => {
  const input: PermissionReaderInput = {credentials: {}, identifier: {path: 'http://test.com/foo'}};
  let readers: jest.Mocked<PermissionReader>[];
  let unionReader: UmaUnionPermissionReader;

  beforeEach(async (): Promise<void> => {
    readers = [
      {
        canHandle: jest.fn(),
        handle: jest.fn().mockResolvedValue({}),
      } as any,
      {
        canHandle: jest.fn(),
        handle: jest.fn().mockResolvedValue({}),
      } as any,
      {
        canHandle: jest.fn(),
        handle: jest.fn().mockResolvedValue({}),
      } as any,
    ];

    unionReader = new UmaUnionPermissionReader(readers);
  });

  it('only uses the results of readers that can handle the input.', async (): Promise<void> => {
    readers[0].canHandle.mockRejectedValue(new Error('bad request'));
    readers[0].handle.mockResolvedValue({[CredentialGroup.agent]: {read: true}});
    readers[1].handle.mockResolvedValue({[CredentialGroup.agent]: {write: true}});
    readers[2].handle.mockResolvedValue({[CredentialGroup.ticket]: {write: true}});
    await expect(unionReader.handle(input)).resolves.toEqual({[CredentialGroup.agent]: {write: true},
      [CredentialGroup.ticket]: {write: true}});
  });

  it('combines results.', async (): Promise<void> => {
    readers[0].handle.mockResolvedValue(
        {[CredentialGroup.agent]: {read: true}, [CredentialGroup.public]: undefined},
    );
    readers[1].handle.mockResolvedValue(
        {[CredentialGroup.agent]: {write: true}, [CredentialGroup.public]: {read: false}},
    );
    readers[2].handle.mockResolvedValue(
        {[CredentialGroup.agent]: {write: true}, [CredentialGroup.public]: {read: false}},
    );
    await expect(unionReader.handle(input)).resolves.toEqual({
      [CredentialGroup.agent]: {read: true, write: true},
      [CredentialGroup.public]: {read: false},
    });
  });

  it('merges same fields using false > true > undefined.', async (): Promise<void> => {
    readers[0].handle.mockResolvedValue(
        {[CredentialGroup.agent]: {read: true, write: false, append: undefined, create: true, delete: undefined}},
    );
    readers[1].handle.mockResolvedValue(
        {[CredentialGroup.agent]: {read: false, write: true, append: true, create: true, delete: undefined}},
    );
    await expect(unionReader.handle(input)).resolves.toEqual({
      [CredentialGroup.agent]: {read: false, write: false, append: true, create: true},
    });
  });
});
