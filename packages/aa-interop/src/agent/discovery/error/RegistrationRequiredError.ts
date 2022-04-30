import {ForbiddenHttpError} from '@digita-ai/handlersjs-http';

export type RedirectUserInfo = {
    redirect_user: string
}

/**
 * This error is thrown by the AgentRegistrationDiscovery
 * when no registration exists for the agent. It includes
 * the URI of the Authorization Agent to which the client
 * should be redirected in order to obtain a registration
 * for the Agent.
 */
export class RegistrationRequiredError extends ForbiddenHttpError {
  public type: string = 'request_denied';
  public additionalParams: RedirectUserInfo;
  /**
     * InvalidGrant UMA Error
     * @param {string} message
     * @param {RedirectUserInfo|RequiredClaimsInfo} additionalParams
     */
  public constructor(message: string, additionalParams: RedirectUserInfo) {
    super(message);
    this.additionalParams = additionalParams;
  }
}
