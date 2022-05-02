

export type DiscoveryRequest = {
    headers: Record<string, string>;
    request_uri: string,
}

export type DiscoveryResponse = {
    agent_registration: string,
    agent_iri: string
}

/**
 * Processes an Agent Registration discovery request
 * and returns a Discovery Response.
 *
 * @throws {UnauthorizedHttpError}
 * @throws {RegistrationRequiredError}
 */
export abstract class AgentRegistrationDiscoveryService {
    abstract handle(req: DiscoveryRequest): Promise<DiscoveryResponse>;
}


