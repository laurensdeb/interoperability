import {Ticket} from '@thundr-be/sai-interfaces';

/**
 * A TicketFactory is responsible for serializing and deserializing
 * UMA Ticket objects.
 */
export abstract class TicketFactory<T extends Ticket = Ticket> {
    public abstract serialize(ticket: T): Promise<string>;
    public abstract deserialize(ticket: string): Promise<T>;
}
