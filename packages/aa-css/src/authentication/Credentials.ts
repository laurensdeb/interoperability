/* eslint-disable no-unused-vars */

import type {AccessMode, ResourceIdentifier} from '@solid/community-server';

/**
 * Credentials identifying an entity accessing or owning data.
 */
export interface Credential {
  webId?: string;
  resource?: ResourceIdentifier;
  modes?: Set<AccessMode>;
}

/**
 * Specific groups that can have credentials.
 */
export enum CredentialGroup {
  public = 'public',
  agent = 'agent',
  ticket = 'ticket',
}

/**
 * A combination of multiple credentials, where their group is specified by the key.
 */
export type CredentialSet = Partial<Record<CredentialGroup, Credential>>;
