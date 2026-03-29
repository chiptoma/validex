export async function* mapAsync(asyncIterable, callback) {
    for await (const value of asyncIterable) {
        yield callback(value);
    }
}
//# sourceMappingURL=map.js.map