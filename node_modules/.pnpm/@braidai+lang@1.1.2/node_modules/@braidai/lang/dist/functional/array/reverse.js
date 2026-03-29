/**
 * Iterates an array in reverse without modifying the original array.
 */
export function* reverse(array) {
    for (let ii = array.length - 1; ii >= 0; --ii) {
        yield array[ii];
    }
}
//# sourceMappingURL=reverse.js.map