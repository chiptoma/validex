/**
 * Eagerly iterates the given iterable, invoking the reducer for each element in the iterable.
 * Uses the previous result as the first parameter and the current value as the second.
 */
export async function reduceAsync(asyncIterable, initial, reducer) {
    let result = initial;
    for await (const value of asyncIterable) {
        result = await reducer(result, value);
    }
    return result;
}
//# sourceMappingURL=reduce.js.map