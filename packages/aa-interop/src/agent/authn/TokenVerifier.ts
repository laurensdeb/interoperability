import {AuthenticatedClient} from '../../authz/strategy/Types';

export type AuthenticationRequest = {
    bearer: string,
    dpop?: string,
    url: string,
    method: 'CONNECT' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE'
}

export type AuthenticationResult = {
    webId: string,
    clientId?: string
}

/**
 * A TokenVerifier verifies an authentication request
 */
export abstract class TokenVerifier {
    abstract authenticate(request: AuthenticationRequest): Promise<AuthenticationResult>;
}
