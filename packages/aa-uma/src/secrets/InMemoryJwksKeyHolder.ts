import {exportJWK, generateKeyPair, JSONWebKeySet, JWK, KeyLike} from 'jose';
import {JwksKeyHolder} from './JwksKeyHolder';
import {v4} from 'uuid';

const SUPPORTED_ALGORITHMS = new Set(['ES256', 'ES384', 'ES512', 'RS256', 'RS384', 'RS512']);

export interface KeyPair {
  privateKey: KeyLike,
  publicKey: KeyLike
}

/**
 * In-memory implementation of a JWKS Key Holder.
 */
export class InMemoryJwksKeyHolder extends JwksKeyHolder {
  private readonly keys: Map<string, KeyPair>;

  /**
   * Yields a new instance of the InMemoryKeyholder
   * @param {string} alg Algorithm to be used for key generation
   */
  public constructor(private readonly alg: string) {
    super();
    if (!SUPPORTED_ALGORITHMS.has(alg)) {
      throw new Error(`The chosen algorithm '${alg}' is not supported by the InMemoryJwksKeyHolder.`);
    }

    this.alg = alg;
    this.keys = new Map();
  }

  /**
   * Get all key identifiers in holder
   * @return {string[]}
   */
  getKids(): string[] {
    return [...this.keys.keys()];
  }

  /**
   * Retrieves private key for kid
   * @param {string} kid - key identfier
   * @return {KeyLike}
   */
  getPrivateKey(kid: string): KeyLike {
    if (!this.keys.has(kid)) {
      throw new Error(`The specified kid '${kid}' does not exist in the holder.`);
    }
    return this.keys.get(kid)!.privateKey;
  }

  /**
   * Retrieves public key for kid
   * @param {string} kid - key identfier
   * @return {KeyLike}
   */
  getPublicKey(kid: string): KeyLike {
    if (!this.keys.has(kid)) {
      throw new Error(`The specified kid '${kid}' does not exist in the holder.`);
    }
    return this.keys.get(kid)!.publicKey;
  }

  /**
   * Get the JWK of the Public Key for some kid.
   * @param {string} kid key identifier
   * @return {Promise<JWK>} the JWK of the public key.
   */
  async toPublicJwk(kid: string): Promise<JWK> {
    if (!this.keys.has(kid)) {
      throw new Error(`The specified kid '${kid}' does not exist in the holder.`);
    }
    return await exportJWK(this.keys.get(kid)!.publicKey);
  }

  /**
   * Yields the JSON Web Key Set for the keys in this Holder.
   * @return {Promise<JSONWebKeySet>} JWKS
   */
  async getJwks(): Promise<JSONWebKeySet> {
    return {keys: await Promise.all(this.getKids().map((kid) => this.toPublicJwk(kid)))};
  }

  /**
   * Generates a new keypair and yields its kid
   * @return {string} key id
   */
  async generateKeypair(): Promise<string> {
    const key = await generateKeyPair(this.alg);
    const kid = v4();

    this.keys.set(kid, key);
    return kid;
  }
}
