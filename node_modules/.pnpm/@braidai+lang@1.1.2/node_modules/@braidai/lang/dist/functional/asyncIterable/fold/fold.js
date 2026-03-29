import { shiftAsync } from "@braidai/lang/functional/asyncIterable/shift";
import { reduceAsync } from "./reduce.js";
/**
 * Similar to `reduce`. It invokes an operation over each element of an array, passing the previous
 * result as the first parameter of the next invocation. If the iterable is empty then `identity`
 * will be returned as default value.
 */
export async function foldAsync(iterable, identity, operation) {
    const { head, rest } = await shiftAsync(iterable);
    if (rest) {
        return reduceAsync(rest, head, operation);
    }
    else {
        return identity;
    }
}
//# sourceMappingURL=fold.js.map