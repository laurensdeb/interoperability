import {UmaConfig, UmaToken} from '../UmaClient';
import * as jose from 'jose';
import {isString} from '../../util/StringGuard';

const AUD = 'solid';

export type JWTVerifyOptions = {
    /**
     * Maximum age of an Access Token to be Valid
     */
    maxTokenAge: string | number,
    /**
     * Base URL of the Resource Server
     */
    baseUrl: string
}
/**
   * Validates & parses Access Token
   * @param {string} token - access token
   * @param {UmaConfig} config - Configuration of the UMA AS
   * @param {JWTVerifyOptions} options - Options for verification
   * @return {UmaToken}
   */
export async function verifyUMAToken(token: string, config: UmaConfig, options: JWTVerifyOptions): Promise<UmaToken> {
  // Validate token JWT against JWKS
  const JWKS = jose.createRemoteJWKSet(new URL(config.jwks_uri));

  const {payload} = await jose.jwtVerify(token, JWKS, {
    issuer: config.issuer,
    audience: AUD,
    maxTokenAge: options.maxTokenAge,
  });

  if (!payload.sub) {
    throw new Error('UMA Access Token is missing \'sub\' claim.');
  }

  if (!payload.webid || !isString(payload.webid)) {
    throw new Error('UMA Access Token is missing authenticated client \'webid\' claim.');
  }

  if (!payload.azp || !isString(payload.azp)) {
    throw new Error('UMA Access Token is missing authenticated client \'azp\' claim.');
  }

  if (!payload.modes || !Array.isArray(payload.modes)) {
    throw new Error('UMA Access Token is missing \'modes\' claim.');
  }

  return {webid: payload.webid, azp: payload.azp, resource: payload.sub, modes: payload.modes};
}
