/**
 * Returns the first element from an iterable, as well as another iterable that will continue after
 * the shifted element.
 */
export async function shiftAsync(iterable) {
    const iterator = iterable[Symbol.asyncIterator]();
    const { done, value } = await iterator.next();
    if (done) {
        return {
            head: undefined,
            rest: undefined,
        };
    }
    else {
        const rest = {
            [Symbol.asyncIterator]() {
                return iterator;
            },
        };
        return {
            head: value,
            rest,
        };
    }
}
//# sourceMappingURL=shift.js.map