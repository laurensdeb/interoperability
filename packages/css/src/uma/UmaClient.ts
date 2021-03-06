export type UmaToken = {
    webid: string,
    azp: string,
    resource: string,
    modes: string[]
}

export interface UmaConfig {
    jwks_uri: string;
    jwks: any;
    issuer: string;
    permission_registration_endpoint: string;
    }

export type PermissionTicketRequest = {
    ticketSubject: string,
    owner: string,
    ticketNeeds: Set<string>
}

/**
 * Client interface for the UMA AS
 */
export abstract class UmaClient {
    public abstract getAsUrl(): string;
    public abstract verifyToken(token: string): Promise<UmaToken>;
    public abstract fetchUMAConfig(): Promise<UmaConfig>;
    public abstract fetchPermissionTicket(request: PermissionTicketRequest): Promise<string | undefined>;
}
