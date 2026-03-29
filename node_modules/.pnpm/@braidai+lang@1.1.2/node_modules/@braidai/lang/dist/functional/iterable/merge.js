import { arrayBisect } from "@braidai/lang/algorithm/arrayBisect";
import { mappedComparator } from "@braidai/lang/comparator";
import { toIterable } from "./intrinsicIterator.js";
/**
 * Merges any number of sorted iterables into a single sorted iterable, using `comparator` to
 * determine the order.
 */
export function merge(comparator, ...iterables) {
    const cursors = [];
    // Return first iterable in case there is only one to avoid delegate runtime cost
    if (iterables.length === 1) {
        return iterables[0];
    }
    return function* () {
        try {
            // Begin all iterators
            for (const iterable of iterables) {
                const iterator = iterable[Symbol.iterator]();
                const next = iterator.next();
                if (!next.done) {
                    cursors.push({
                        iterator,
                        value: next.value,
                    });
                }
            }
            // Sort current iterator cursors
            const cursorsComparator = mappedComparator(comparator, (cursor) => cursor.value);
            cursors.sort(cursorsComparator);
            // Merge 2 or more iterators
            while (cursors.length > 1) {
                // Yield next value
                const cursor = cursors[0];
                const valueFromNextCursor = cursors[1].value;
                yield cursor.value;
                // Continue yielding while the next value is less than the one on the stack. This just
                // serves as a fast path for the expected common case where many values in a row are
                // yielded from the same list.
                while (true) {
                    const next = cursor.iterator.next();
                    if (next.done) {
                        // Finished with this iterator
                        cursors.shift();
                        break;
                    }
                    else if (comparator(next.value, valueFromNextCursor) <= 0) {
                        yield next.value;
                    }
                    else {
                        // Insert cursor into correct position
                        cursor.value = next.value;
                        cursors.shift();
                        const ii = arrayBisect(cursors, cursor, cursorsComparator);
                        cursors.splice(ii, 0, cursor);
                        break;
                    }
                }
            }
            // Delegate remaining values from final iterator
            if (cursors.length === 1) {
                const current = cursors[0];
                yield current.value;
                yield* toIterable(current.iterator);
            }
        }
        catch (err) {
            // Unwind remaining iterators on failure
            for (const iterator of cursors) {
                try {
                    iterator.iterator.return?.();
                }
                catch { }
            }
            throw err;
        }
    }();
}
//# sourceMappingURL=merge.js.map