
export type RegistrationRequest = {
    headers: Record<string, string>;
    request_uri: string,
    body: {
        accessNeedsGroup: URL
    }
}

export type RegistrationResponse = {
    agent_registration: string,
    agent_iri: string
}

/**
 * Processes an Agent Registration request
 * and returns a Registration if one could be made.
 *
 * @throws {UnauthorizedHttpError}
 * @throws {UnauthenticatedHttpError}
 */
export abstract class AgentRegistrationService {
    abstract handle(req: RegistrationRequest): Promise<RegistrationResponse>;
}
