
export type UmaToken = {
    webid: string,
    azp: string,
    resource: string,
    modes: string[]
}

export interface UmaConfig {
    jwks_uri: string;
    issuer: string;
    permission_registration_endpoint: string;
    }
/**
 * Client interface for the UMA AS
 */
export abstract class UmaClient {
    public abstract getAsUrl(): string;
    public abstract verifyToken(token: string): Promise<UmaToken>;
    public abstract fetchUMAConfig(): Promise<UmaConfig>;
    public abstract fetchPermissionTicket(ticketSubject: string, owner: string,
        ticketNeeds: Set<string>): Promise<string | undefined>;
}
