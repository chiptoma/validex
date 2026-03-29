/**
 * Intersperses `separator` between every element of an iterable.
 */
export function* intersperse(iterable, separator) {
    let first = true;
    for (const value of iterable) {
        if (first) {
            first = false;
        }
        else {
            yield separator;
        }
        yield value;
    }
}
//# sourceMappingURL=intersperse.js.map