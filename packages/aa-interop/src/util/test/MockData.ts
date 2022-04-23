import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {Application, SocialAgent, RequestedPermissions} from '../../authz/strategy/Types';

export const WEBID_ALICE = 'https://pod.example.org/alice/profile/card#me';
export const WEBID_BOB = 'https://pod.example.org/bob/profile/card#me';

export const APP_CLIENTID = 'https://app.example.org';

export const MOCK_RESOURCE = 'https://pod.example.org/alice/test/123';
export const MOCK_POD = 'https://pod.example.org/alice';

export const MOCK_APPLICATION = new Application(APP_CLIENTID);
export const MOCK_SOCIAL_AGENT = new SocialAgent(WEBID_BOB);

export const MOCK_REQUEST: RequestedPermissions = {
  resource: MOCK_RESOURCE,
  owner: WEBID_ALICE,
  modes: new Set([AccessMode.read]),
};
