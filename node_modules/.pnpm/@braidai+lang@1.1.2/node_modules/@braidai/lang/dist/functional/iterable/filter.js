import { Iterator, toIterable } from "@braidai/lang/functional/iterable/intrinsicIterator";
/** @internal */
export const truthy = Boolean;
export const filter = function () {
    if (Iterator) {
        return (iterable, predicate = truthy) => toIterable(Iterator.from(iterable).filter(predicate));
    }
    else {
        return function* (iterable, predicate = truthy) {
            let index = 0;
            for (const value of iterable) {
                if (Boolean(predicate(value, index++))) {
                    yield value;
                }
            }
        };
    }
}();
//# sourceMappingURL=filter.js.map