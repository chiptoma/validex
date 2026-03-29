import { map } from "./map.js";
/**
 * Applies a given async function to an iterable, and returns a promise to an array of the results.
 */
export function mapAwait(iterable, callback) {
    return Promise.all(map(iterable, callback));
}
//# sourceMappingURL=mapAwait.js.map