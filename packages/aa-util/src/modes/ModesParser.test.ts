import {AccessMode} from './AccessModes';
import {parseModes} from './ModesParser';

describe('parseModes', () => {
  it('should successfully parse valid modes', () => {
    expect(parseModes(['http://www.w3.org/ns/auth/acl#Read',
      'http://www.w3.org/ns/auth/acl#Append',
      'http://www.w3.org/ns/auth/acl#Write',
      'http://www.w3.org/ns/auth/acl#Create',
      'http://www.w3.org/ns/auth/acl#Delete'])).toEqual(new Set([AccessMode.read, AccessMode.append, AccessMode.write, AccessMode.create, AccessMode.delete]));
  });
  it('should throw error on invalid mode', () => {
    expect(() => parseModes(['http://www.w3.org/ns/auth/acl#Read',
      'abc'])).toThrowError(`Invalid access mode: abc.`);
  });
});
