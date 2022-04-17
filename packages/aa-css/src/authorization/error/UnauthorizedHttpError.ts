/* eslint-disable camelcase */
import {generateHttpErrorClass, getLoggerFor,
  HttpErrorOptions, toNamedTerm, toObjectTerm} from '@solid/community-server';
import type {Quad, Quad_Subject} from 'rdf-js';
import {DataFactory} from 'n3';
import quad = DataFactory.quad;
import {ACL, AUTH} from '../../util/Vocabularies';

const BaseHttpError = generateHttpErrorClass(401, 'Unauthorized');

/**
 * An error thrown when data was found for the requested identifier, but is not supported by the target resource.
 * Can keep track of the methods that are not allowed.
 */
export class UnauthorizedHttpError extends BaseHttpError {
  protected readonly logger = getLoggerFor(this);

  public readonly modes: Readonly<string[]>;
  public readonly resource: Readonly<string>;

  /**
   *
   * @param {string[]} modes
   * @param {string} resource
   * @param {string} message
   * @param {HttpErrorOptions} options
   */
  public constructor(modes: string[] = [], resource: string, message?: string, options?: HttpErrorOptions) {
    super(message ?? `Missing required access: ${modes}`, options);
    this.logger.info(`Missing required access: ${modes} on ${resource}`);
    this.modes = modes;
    this.resource = resource;
  }

  /**
   * Generate Error Metadata
   * @param {Quad_Subject | string} subject
   * @return {Quad[]}
   */
  public generateMetadata(subject: Quad_Subject | string): Quad[] {
    const term = toNamedTerm(subject);
    const quads = super.generateMetadata(term);
    quads.push(quad(term, AUTH.terms.ticketSubject, toObjectTerm(this.resource, true)));
    for (const mode of this.modes) {
      const capitalizedMode = mode.charAt(0).toUpperCase() + mode.slice(1) as 'Read' | 'Write' | 'Create' |
        'Append' | 'Delete';
      quads.push(quad(term, AUTH.terms.ticketNeeds, ACL.terms[capitalizedMode]));
    }
    return quads;
  }
}
