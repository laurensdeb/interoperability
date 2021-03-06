/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
import {UnionHandler} from '@solid/community-server';
import type {CredentialGroup} from '../authentication/Credentials';
import type {PermissionReader} from './PermissionReader';
import type {Permission, PermissionSet} from './permissions/Permissions';

/**
 * Combines the results of multiple PermissionReaders.
 * Every permission in every credential type is handled according to the rule `false` \> `true` \> `undefined`.
 */
export class UmaUnionPermissionReader extends UnionHandler<PermissionReader> implements PermissionReader {
  public constructor(readers: PermissionReader[]) {
    super(readers);
  }

  protected async combine(results: PermissionSet[]): Promise<PermissionSet> {
    const result: PermissionSet = {};
    for (const permissionSet of results) {
      for (const [key, value] of Object.entries(permissionSet) as [ CredentialGroup, Permission | undefined ][]) {
        result[key] = this.applyPermissions_(value, result[key]);
      }
    }
    return result;
  }

  /**
   * Adds the given permissions to the result object according to the combination rules of the class.
   */
  private applyPermissions_(permissions?: Permission, result: Permission = {}): Permission {
    if (!permissions) {
      return result;
    }

    for (const [key, value] of Object.entries(permissions) as [ keyof Permission, boolean | undefined ][]) {
      if (typeof value !== 'undefined' && result[key] !== false) {
        result[key] = value;
      }
    }
    return result;
  }
}
