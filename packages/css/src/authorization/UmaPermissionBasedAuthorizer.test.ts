import {ForbiddenHttpError, NotFoundHttpError, ResourceSet} from '@solid/community-server';
import {CredentialGroup} from '../authentication/Credentials';
import {UnauthorizedHttpError} from './error/UnauthorizedHttpError';
import {AccessMode} from './permissions/Permissions';
import {AuthorizerInput, UmaPermissionBasedAuthorizer} from './UmaPermissionBasedAuthorizer';


describe('A PermissionBasedAuthorizer', (): void => {
  let input: AuthorizerInput;
  let resourceSet: jest.Mocked<ResourceSet>;
  let authorizer: UmaPermissionBasedAuthorizer;

  beforeEach(async (): Promise<void> => {
    input = {
      identifier: {path: 'http://test.com/foo'},
      modes: new Set<AccessMode>(),
      permissionSet: {},
      credentials: {},
    };
    resourceSet = {
      hasResource: jest.fn().mockResolvedValue(true),
    };

    authorizer = new UmaPermissionBasedAuthorizer(resourceSet);
  });

  it('can handle any input.', async (): Promise<void> => {
    await expect(authorizer.canHandle(input)).resolves.toBeUndefined();
  });

  it('allows access if the permissions are matched by the reader output.', async (): Promise<void> => {
    input.modes = new Set([AccessMode.read, AccessMode.write]);
    input.permissionSet = {
      [CredentialGroup.public]: {read: true, write: false},
      [CredentialGroup.agent]: {write: true},
    };
    await expect(authorizer.handle(input)).resolves.toBeUndefined();
  });

  it('allows access if the permissions are matched by the reader output.', async (): Promise<void> => {
    input.modes = new Set([AccessMode.read, AccessMode.write]);
    input.permissionSet = {
      [CredentialGroup.public]: {read: true, write: false},
      [CredentialGroup.agent]: {read: false, write: false},
      [CredentialGroup.ticket]: {write: true},
    };
    await expect(authorizer.handle(input)).resolves.toBeUndefined();
  });

  it('throws an UnauthorizedHttpError when an unauthenticated request has no access.', async (): Promise<void> => {
    input.modes = new Set([AccessMode.read, AccessMode.write]);
    input.permissionSet = {
      [CredentialGroup.public]: {read: true, write: false},
    };
    await expect(authorizer.handle(input)).rejects.toThrow(UnauthorizedHttpError);
  });

  it('throws a ForbiddenHttpError when an authenticated request has no access.', async (): Promise<void> => {
    input.credentials = {agent: {webId: 'http://test.com/#me'}};
    input.modes = new Set([AccessMode.read, AccessMode.write]);
    input.permissionSet = {
      [CredentialGroup.public]: {read: true, write: false},
    };
    await expect(authorizer.handle(input)).rejects.toThrow(ForbiddenHttpError);
  });

  it('throws a ForbiddenHttpError when an authenticated request has no access.', async (): Promise<void> => {
    input.credentials = {ticket: {webId: 'http://test.com/#me'}};
    input.modes = new Set([AccessMode.read, AccessMode.write]);
    input.permissionSet = {
      [CredentialGroup.public]: {read: true, write: false},
    };
    await expect(authorizer.handle(input)).rejects.toThrow(ForbiddenHttpError);
  });

  it('defaults to empty permissions for the Authorization.', async (): Promise<void> => {
    await expect(authorizer.handle(input)).resolves.toBeUndefined();
  });

  it('throws a 404 in case the target resource does not exist and would not be written to.',
      async (): Promise<void> => {
        resourceSet.hasResource.mockResolvedValueOnce(false);
        input.modes = new Set([AccessMode.delete]);
        input.permissionSet = {
          [CredentialGroup.public]: {read: true},
        };
        await expect(authorizer.handle(input)).rejects.toThrow(NotFoundHttpError);
      });
});
