/**
 * Constructs a single link header following the format in
 * RFC 59988
 *
 * @link https://www.rfc-editor.org/rfc/rfc5988
 *
 * @param {string} ref - subject of link header
 * @param {string} rel - link relation
 * @param {string} anchor - context of a link conveyed in the Link header
 * @return {string}
 */
export function constructAnchorLinkHeader(ref: string, rel: string, anchor?: string): string {
  return `<${ref}>; ${anchor?`anchor="${anchor}"; `:``}rel="${rel}"`;
}
