import {ResourceIdentifier} from './ResourceIdentifier';
import {AccessMode} from '@laurensdeb/authorization-agent-helpers';

export interface Ticket {
    sub: ResourceIdentifier;
    owner: string;
    requested: Set<AccessMode>;

}
