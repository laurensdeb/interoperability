export type DpopBoundIdToken = {
    id_token: string,
    dpop: string
}

export type DPoP = {
    token: string,
    jkt: string
}

export type Client = {
    webid: string,
    azp: string
}

/**
 * A Token factory yielding DPoP-bound tokens
 */
export abstract class DpopBoundTokenFactory {
    abstract getDpop(htu: string, htm: string): Promise<DPoP>;
    abstract getToken(uri: string, method: string, client: Client): Promise<DpopBoundIdToken>;
}
