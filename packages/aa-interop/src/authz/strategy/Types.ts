import {AccessMode} from '@laurensdeb/authorization-agent-helpers';

export type AuthenticatedClient = SocialAgent | Application;
export type SocialAgent = {
    webId: string
}

export type Application = {
    clientId: string
}

export type RequestedPermissions = {
    resource: string,
    modes: Set<AccessMode>,
    owner: string
}
