/** @internal */
export const Iterator = globalThis.Iterator;
/** @internal */
export function toIterable(iterator) {
    return {
        [Symbol.iterator]() {
            return iterator;
        },
    };
}
//# sourceMappingURL=intrinsicIterator.js.map