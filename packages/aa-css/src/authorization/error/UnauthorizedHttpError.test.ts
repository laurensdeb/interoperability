import {toNamedTerm} from '@solid/community-server';
import {ACL, AUTH} from '../../util/Vocabularies';
import {DataFactory} from 'n3';
import quad = DataFactory.quad;
import {UnauthorizedHttpError} from './UnauthorizedHttpError';

const RESOURCE = 'https://example.org/test/example';
const RESOURCE_TERM = toNamedTerm(RESOURCE);

describe('A UnauthorizedHttpError', () => {
  it('when constructed with modes should yield a new Error', () => {
    const error = new UnauthorizedHttpError(['read'], '/test/example');
    expect(error instanceof Error).toBeTruthy();
    expect(error.message).toEqual(`Missing required access: read`);
  });
  it('when constructed with message should yield a new Error', () => {
    const error = new UnauthorizedHttpError(['read'], '/test/example', 'test');
    expect(error instanceof Error).toBeTruthy();
    expect(error.message).toEqual(`test`);
  });
  describe('when metadata is requested', () => {
    it('and modes are valid, should return metadata', () => {
      const error = new UnauthorizedHttpError(['read', 'write', 'create', 'append', 'delete'], RESOURCE);
      const metadata = error.generateMetadata(RESOURCE);
      expect(metadata).toContainEqual(quad(RESOURCE_TERM, AUTH.terms.ticketSubject, toNamedTerm(RESOURCE)));
      expect(metadata).toContainEqual(quad(RESOURCE_TERM, AUTH.terms.ticketNeeds, ACL.terms.Append));
      expect(metadata).toContainEqual(quad(RESOURCE_TERM, AUTH.terms.ticketNeeds, ACL.terms.Create));
      expect(metadata).toContainEqual(quad(RESOURCE_TERM, AUTH.terms.ticketNeeds, ACL.terms.Delete));
      expect(metadata).toContainEqual(quad(RESOURCE_TERM, AUTH.terms.ticketNeeds, ACL.terms.Read));
      expect(metadata).toContainEqual(quad(RESOURCE_TERM, AUTH.terms.ticketNeeds, ACL.terms.Write));
    });

    it('and modes is invalid, should return metadata', () => {
      const error = new UnauthorizedHttpError(['read', 'abc'], RESOURCE);
      const metadata = error.generateMetadata(RESOURCE);
      expect(metadata).toContainEqual(quad(RESOURCE_TERM, AUTH.terms.ticketSubject, toNamedTerm(RESOURCE)));
      expect(metadata).toContainEqual(quad(RESOURCE_TERM, AUTH.terms.ticketNeeds, ACL.terms.Read));
    });
  });
});
