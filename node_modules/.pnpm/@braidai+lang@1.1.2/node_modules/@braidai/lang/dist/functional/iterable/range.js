export function range(start = Infinity, end) {
    if (end === undefined) {
        // First overload
        return range(0, start);
    }
    else {
        return function* () {
            if (start < end) {
                for (let ii = start; ii < end; ++ii) {
                    yield ii;
                }
            }
            else {
                for (let ii = start - 1; ii >= end; --ii) {
                    yield ii;
                }
            }
        }();
    }
}
//# sourceMappingURL=range.js.map