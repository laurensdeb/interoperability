import {ResourceIdentifier} from './ResourceIdentifier';
import {AccessMode} from '@thundr-be/sai-helpers';

export interface Ticket {
    sub: ResourceIdentifier;
    owner: string;
    requested: Set<AccessMode>;

}
