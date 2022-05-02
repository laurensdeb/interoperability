
/**
 * A ClientId strategy is tasked with providing
 * the proper Authorization Agent ClientId for
 * some WebID, and to convert a ClientId back to
 * the WebID.
 */
export abstract class ClientIdStrategy {
    public abstract getClientIdForWebId(webid: string): Promise<string>;
    public abstract getWebIdForClientId(clientid: string): Promise<string>;
}
