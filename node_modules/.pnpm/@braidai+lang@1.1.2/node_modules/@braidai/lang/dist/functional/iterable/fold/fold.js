import { reduce } from "@braidai/lang/functional/iterable/fold/reduce";
import { shift } from "@braidai/lang/functional/iterable/shift";
/**
 * Similar to `reduce`. It invokes an operation over each element of an array, passing the previous
 * result as the first parameter of the next invocation. If the iterable is empty then `identity`
 * will be returned as default value.
 */
export function fold(iterable, identity, operation) {
    const { head, rest } = shift(iterable);
    if (rest) {
        return reduce(rest, head, operation);
    }
    else {
        return identity;
    }
}
//# sourceMappingURL=fold.js.map