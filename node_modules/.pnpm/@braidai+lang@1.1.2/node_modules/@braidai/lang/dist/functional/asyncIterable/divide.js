import { map } from "@braidai/lang/functional/iterable/map";
import { range } from "@braidai/lang/functional/iterable/range";
/**
 * Returns an array of iterables each of which iterates over a single invocation of the given
 * iterable. This can be used as a parallelization primitive.
 */
export function divide(iterable, count) {
    let current;
    let remaining = count;
    const iterator = iterable[Symbol.asyncIterator]();
    const iterables = map(range(count), async function* () {
        try {
            while (true) {
                current = async function () {
                    const previous = await current;
                    if (previous?.done) {
                        return previous;
                    }
                    return iterator.next();
                }();
                const result = await current;
                if (result.done) {
                    break;
                }
                else {
                    yield result.value;
                }
            }
        }
        finally {
            if (--remaining === 0) {
                await iterator.return?.();
            }
        }
    });
    return [...iterables];
}
//# sourceMappingURL=divide.js.map