/**
 * Reorder the elements such that elements matching `predicate` are first. Relative order of
 * elements is preserved.
 */
export function stablePartition(array, predicate, first = 0, last = array.length) {
    let current = first;
    const notMatched = [];
    for (let ii = current; ii < last; ++ii) {
        if (predicate(array[ii])) {
            array[current++] = array[ii];
        }
        else {
            notMatched.push(array[ii]);
        }
    }
    const result = current;
    for (const value of notMatched) {
        array[current++] = value;
    }
    return result;
}
//# sourceMappingURL=stablePartition.js.map