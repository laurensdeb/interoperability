import {AsyncHandler, ResourceIdentifier} from '@solid/community-server';
import {CredentialSet} from '../authentication/Credentials';
import {PermissionSet} from './permissions/Permissions';


export interface PermissionReaderInput {
  /**
   * Credentials of the entity that wants to use the resource.
   */
  credentials: CredentialSet;
  /**
   * Identifier of the resource that will be read/modified.
   */
  identifier: ResourceIdentifier;
}

/**
 * Discovers the permissions of the given credentials on the given identifier.
 */
export abstract class PermissionReader extends AsyncHandler<PermissionReaderInput, PermissionSet> {}
