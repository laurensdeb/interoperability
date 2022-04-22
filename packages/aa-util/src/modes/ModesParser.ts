import {isString} from '../util/StringGuard';
import {AccessMode} from './AccessModes';

/**
   * Convert array to array of access modes.
   * Will throw an error for any invalid modes.
   *
   * @param {any[]} modes
   * @return {Set<AccessMode>} - access modes
   */
export function parseModes(modes: any[]): Set<AccessMode> {
  const result = new Set<AccessMode>();
  modes.forEach((value) => {
    if (!isString(value) || !(Object.values(AccessMode).some((v) => v === value))) {
      throw new Error(`Invalid access mode: ${value}.`);
    }
    result.add(value as AccessMode);
  });
  return result;
}
