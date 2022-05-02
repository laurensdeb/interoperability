import {createUriAndTermNamespace} from '@solid/community-server';

export const ACL = createUriAndTermNamespace('http://www.w3.org/ns/auth/acl#',
    'accessTo',
    'agent',
    'agentClass',
    'agentGroup',
    'AuthenticatedAgent',
    'Authorization',
    'default',
    'mode',

    'Write',
    'Read',
    'Update',
    'Append',
    'Create',
    'Delete',
    'Control',
);

export const AUTH = createUriAndTermNamespace('urn:solid:auth:',
    'userMode',
    'publicMode',
    'ticketNeeds',
    'ticketSubject',
);
