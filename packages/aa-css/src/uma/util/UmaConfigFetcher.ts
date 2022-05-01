import {isString} from '../../util/StringGuard';
import {UmaConfig} from '../UmaClient';
import fetch from 'cross-fetch';
import {ISSUER, JWKS_URI, PERMISSION_REGISTRATION_ENDPOINT, UMA_DISCOVERY} from './Constants';
import * as jose from 'jose';

const REQUIRED_CONFIG_KEYS = [ISSUER, JWKS_URI, PERMISSION_REGISTRATION_ENDPOINT];
/**
   * Fetch UMA Configuration of AS
   * @param {string} asUrl - Base URL of the UMA AS
   * @return {Promise<UmaConfig>} - UMA Configuration
   */
export async function fetchUMAConfig(asUrl: string): Promise<UmaConfig> {
  const res = await fetch(asUrl + UMA_DISCOVERY);

  if (res.status >= 400) {
    throw new Error(`Unable to retrieve UMA Configuration for Authorization Server '${asUrl}'`);
  }

  const configuration = await res.json();

  if (REQUIRED_CONFIG_KEYS.some((value) => !(value in configuration))) {
    throw new Error(`The UMA Configuration for Authorization Server '${asUrl}'` +
          ` is missing required attributes ${REQUIRED_CONFIG_KEYS.filter((value) =>
            !(value in configuration) ).map((value) => `"${value}"`).join(', ')}`);
  }

  if (REQUIRED_CONFIG_KEYS.some((value) => !isString(configuration[value]))) {
    throw new Error(`The UMA Configuration for Authorization Server '${asUrl}'` +
    ` should have string attributes ${REQUIRED_CONFIG_KEYS.filter((value) =>
      !isString(configuration[value]) ).map((value) => `"${value}"`).join(', ')}`);
  }

  return {jwks_uri: configuration.jwks_uri, jwks: jose.createRemoteJWKSet(new URL(configuration.jwks_uri)), issuer: configuration.issuer,
    permission_registration_endpoint: configuration.permission_registration_endpoint};
}
