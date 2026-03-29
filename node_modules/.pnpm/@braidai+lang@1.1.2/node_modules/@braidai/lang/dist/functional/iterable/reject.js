import { filter } from "./filter.js";
export function reject(iterable, predicate) {
    return filter(iterable, (value, index) => !predicate(value, index));
}
//# sourceMappingURL=reject.js.map