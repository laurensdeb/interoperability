import {AccessMode} from '@laurensdeb/authorization-agent-helpers';
import {Ticket} from './Ticket';
import {Principal} from './AccessToken';

/**
 * An authorizer will determine, for some given request and client
 * what access modes it can authorize.
 */
export abstract class Authorizer {
    public abstract authorize(client: Principal, request: Ticket): Promise<Set<AccessMode>>;
}
