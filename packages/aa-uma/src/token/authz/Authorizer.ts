import {AccessMode} from '../../util/modes/AccessModes';
import {Ticket} from '../TicketFactory';
import {Principal} from '../UmaGrantProcessor';

/**
 * An authorizer will determine, for some given request and client
 * what access modes it can authorize.
 */
export abstract class Authorizer {
    public abstract authorize(client: Principal, request: Ticket): Promise<Set<AccessMode>>;
}
