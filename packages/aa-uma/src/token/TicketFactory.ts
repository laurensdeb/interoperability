import {AccessMode} from '../util/modes/AccessModes';
import {ResourceIdentifier} from '../util/ResourceIdentifier';

export interface Ticket {
    sub: ResourceIdentifier,
    id: string,
    requested: Set<AccessMode>

}

/**
 * A TicketFactory is responsible for serializing and deserializing
 * UMA Ticket objects.
 */
export abstract class TicketFactory<T extends Ticket = Ticket> {
    public abstract serialize(ticket: T): Promise<string>;
    public abstract deserialize(ticket: string): Promise<T>;
}
