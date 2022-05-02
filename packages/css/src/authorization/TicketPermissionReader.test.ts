import {AccessMode} from './permissions/Permissions';
import {TicketPermissionReader} from './TicketPermissionReader';

describe('A TicketPermissionReader', () => {
  const permissionReader = new TicketPermissionReader();

  const resource = {path: 'https://example.org/123'};
  const resourceAlt = {path: 'https://example.org/456'};
  const webId = 'https://example.org/alice';
  const modes = new Set([AccessMode.read, AccessMode.write, AccessMode.append, AccessMode.create, AccessMode.delete]);


  test('should return permissions for UMA token if resources match', async () => {
    const permissionSet = await permissionReader.handle({identifier: resource,
      credentials: {ticket: {resource, webId, modes}}});
    expect(permissionSet.ticket).toBeTruthy();
    expect(permissionSet.ticket?.read).toBeTruthy();
    expect(permissionSet.ticket?.append).toBeTruthy();
    expect(permissionSet.ticket?.create).toBeTruthy();
    expect(permissionSet.ticket?.delete).toBeTruthy();
    expect(permissionSet.ticket?.write).toBeTruthy();
  });

  test('should return no permissions for UMA token if resources match but permissions are empty', async () => {
    const permissionSet = await permissionReader.handle({identifier: resource,
      credentials: {ticket: {resource, webId, modes: new Set()}}});
    expect(permissionSet.ticket).toBeTruthy();
    expect(permissionSet.ticket?.read).toBeFalsy();
    expect(permissionSet.ticket?.append).toBeFalsy();
    expect(permissionSet.ticket?.create).toBeFalsy();
    expect(permissionSet.ticket?.delete).toBeFalsy();
    expect(permissionSet.ticket?.write).toBeFalsy();
  });

  test('should not return permissions for UMA token if resources mismatch', async () => {
    const permissionSet = await permissionReader.handle({identifier: resourceAlt,
      credentials: {ticket: {resource, webId, modes}}});
    expect(permissionSet.ticket).toBeUndefined();
  });
});
