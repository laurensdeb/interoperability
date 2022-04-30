import {constructAnchorLinkHeader} from './constructLinkHeader';
const LinkHeader = require( 'http-link-header' );

describe('constructLinkHeader', () => {
  it('Should construct a valid link header', () => {
    const res = constructAnchorLinkHeader('https://example.org/123', 'next');
    const parsed = LinkHeader.parse(res);

    expect(parsed.refs.length).toEqual(1);
    expect(parsed.refs[0].uri).toEqual('https://example.org/123');
    expect(parsed.refs[0].rel).toEqual('next');
  });
  it('Should construct a valid link header with anchor', () => {
    const res = constructAnchorLinkHeader('https://example.org/123', 'next', 'https://example.org/456');
    const parsed = LinkHeader.parse(res);

    expect(parsed.refs.length).toEqual(1);
    expect(parsed.refs[0].uri).toEqual('https://example.org/123');
    expect(parsed.refs[0].anchor).toEqual('https://example.org/456');
    expect(parsed.refs[0].rel).toEqual('next');
  });
});
