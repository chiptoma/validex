import { identity } from "@braidai/lang/functional/function/identity";
import { transform } from "./transform.js";
/**
 * Iterate each item from an iterable of iterables.
 */
export function concat(iterators) {
    return transform(iterators, identity);
}
//# sourceMappingURL=concat.js.map