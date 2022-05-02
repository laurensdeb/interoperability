import {RoutePath} from '@thundr-be/sai-helpers';
import {WebIdHandler} from './WebIdHandler';
import {lastValueFrom} from 'rxjs';
import {Parser, Store, DataFactory, Quad} from 'n3';
const {namedNode} = DataFactory;

const WEBID = 'https://example.com/profile';
describe('A WebIdHandler', () => {
  const handler = new WebIdHandler(new RoutePath('https://example.com', '/idp'));

  it('Should return a valid WebID with solid:oidcIssuer', async () => {
    const result = await lastValueFrom(handler.handle({request: {method: 'GET', headers: {}, url: new URL(WEBID)}}));
    expect(result.status).toBe(200);
    expect(result.headers).toEqual({'content-type': 'text/turtle'});
    expect(result.body).toBeDefined();

    const store = await parseTurtle(result.body);
    const issuerQuads = store.getQuads(namedNode(WEBID), namedNode('http://www.w3.org/ns/solid/terms#oidcIssuer'), null, null);
    expect(issuerQuads.length).toEqual(1);
    expect(issuerQuads[0].object.value).toEqual('https://example.com/idp');
  });
});

/**
 * Parses a TTL resource
 *
 * @param {string} data
 * @return {Promise<Store>}
 */
function parseTurtle(data: string): Promise<Store> {
  const quadsArray: Quad[] = [];
  const parser = new Parser({format: 'text/turtle'});
  return new Promise((resolve, reject) => {
    parser.parse(data, (err, quad, prefixes) => {
      if (quad) {
        quadsArray.push(quad);
      }
      if (err) return reject(err);
      if (!quad) {
        const store = new Store();
        store.addQuads(quadsArray);
        resolve(store);
      }
    });
  });
}
